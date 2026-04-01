import { describe, it, expect, beforeEach, afterEach, vi, afterAll } from "vitest";
import * as net from "node:net";
import { BaseAdapter, JsonRpcResponse } from "../adapters/base.js";

// Concrete subclass for testing the abstract BaseAdapter
class TestAdapter extends BaseAdapter {
  public receivedMessages: JsonRpcResponse[] = [];

  constructor(port: number, host: string = "127.0.0.1") {
    super("test", port, host);
  }

  protected override onMessage(message: JsonRpcResponse): void {
    this.receivedMessages.push(message);
  }

  // Expose protected fields for testing
  getSocket() {
    return this.socket;
  }
  getPending() {
    return this.pending;
  }
  getReceiveBuffer() {
    return this.receiveBuffer;
  }
  getReconnectDelay() {
    return this.currentReconnectDelay;
  }
  getShouldReconnect() {
    return this.shouldReconnect;
  }
  setRequestTimeout(ms: number) {
    this.requestTimeout = ms;
  }
}

function createTcpServer(): Promise<{ server: net.Server; port: number }> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as net.AddressInfo;
      resolve({ server, port: addr.port });
    });
  });
}

function waitForConnection(server: net.Server): Promise<net.Socket> {
  return new Promise((resolve) => {
    server.once("connection", resolve);
  });
}

describe("BaseAdapter", () => {
  let tcpServer: net.Server;
  let port: number;
  let adapter: TestAdapter;
  let serverSockets: net.Socket[];

  beforeEach(async () => {
    serverSockets = [];
    const s = await createTcpServer();
    tcpServer = s.server;
    port = s.port;
    adapter = new TestAdapter(port);

    // Track all server-side connections so we can destroy them in afterEach
    tcpServer.on("connection", (socket) => {
      serverSockets.push(socket);
    });
  });

  afterEach(async () => {
    await adapter.disconnect();
    // Destroy all server-side sockets so tcpServer.close() does not hang
    for (const s of serverSockets) {
      s.destroy();
    }
    await new Promise<void>((resolve) => tcpServer.close(() => resolve()));
  });

  describe("connection and disconnection lifecycle", () => {
    it("should start in a disconnected state", () => {
      expect(adapter.isConnected()).toBe(false);
    });

    it("should connect to the TCP server", async () => {
      const connPromise = waitForConnection(tcpServer);
      await adapter.connect();

      expect(adapter.isConnected()).toBe(true);
      const clientSocket = await connPromise;
      clientSocket.destroy();
    });

    it("should emit a connected event on successful connection", async () => {
      const connectedHandler = vi.fn();
      adapter.on("connected", connectedHandler);

      await adapter.connect();

      expect(connectedHandler).toHaveBeenCalledOnce();
    });

    it("should be a no-op if already connected", async () => {
      await adapter.connect();
      // Should not throw or create a new connection
      await adapter.connect();
      expect(adapter.isConnected()).toBe(true);
    });

    it("should disconnect cleanly", async () => {
      await adapter.connect();
      expect(adapter.isConnected()).toBe(true);

      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
      expect(adapter.getSocket()).toBeNull();
    });

    it("should emit a disconnected event when the remote end closes", async () => {
      const connPromise = waitForConnection(tcpServer);
      await adapter.connect();

      const clientSocket = await connPromise;
      const disconnectPromise = new Promise<void>((resolve) => {
        adapter.on("disconnected", resolve);
      });

      // Disable reconnect so the test does not hang
      adapter["shouldReconnect"] = false;
      clientSocket.destroy();
      await disconnectPromise;

      expect(adapter.isConnected()).toBe(false);
    });

    it("should fail to connect when no server is listening", async () => {
      await new Promise<void>((resolve) => tcpServer.close(() => resolve()));

      const badAdapter = new TestAdapter(port);
      await expect(badAdapter.connect()).rejects.toThrow();
      expect(badAdapter.isConnected()).toBe(false);
    });
  });

  describe("auto-reconnect behavior", () => {
    it("should set shouldReconnect to false after disconnect()", async () => {
      await adapter.connect();
      await adapter.disconnect();
      expect(adapter.getShouldReconnect()).toBe(false);
    });

    it("should schedule reconnect when connection is closed and shouldReconnect is true", async () => {
      const connPromise = waitForConnection(tcpServer);
      await adapter.connect();

      const clientSocket = await connPromise;

      // The adapter should try to reconnect - we track it via the reconnecting flag
      const disconnectPromise = new Promise<void>((resolve) => {
        adapter.on("disconnected", resolve);
      });

      clientSocket.destroy();
      await disconnectPromise;

      // After disconnect, reconnecting should be scheduled
      expect(adapter["reconnecting"]).toBe(true);

      // Clean up: disable reconnect so the test does not hang
      adapter["shouldReconnect"] = false;
      if (adapter["reconnectTimer"]) {
        clearTimeout(adapter["reconnectTimer"]);
      }
    });

    it("should not schedule reconnect when disconnect() is called explicitly", async () => {
      await adapter.connect();
      await adapter.disconnect();

      expect(adapter["reconnecting"]).toBe(false);
      expect(adapter["reconnectTimer"]).toBeNull();
    });
  });

  describe("JSON-RPC request/response matching", () => {
    it("should send a JSON-RPC request and receive a matching response", async () => {
      const connPromise = waitForConnection(tcpServer);
      await adapter.connect();
      const serverSocket = await connPromise;

      // Listen for data from the adapter
      const dataPromise = new Promise<string>((resolve) => {
        serverSocket.once("data", (data: Buffer) => resolve(data.toString()));
      });

      // Send command
      const responsePromise = adapter.sendCommand("test.method", { key: "value" });

      // Read the request sent by the adapter
      const requestStr = await dataPromise;
      const request = JSON.parse(requestStr.trim());

      expect(request.jsonrpc).toBe("2.0");
      expect(request.method).toBe("test.method");
      expect(request.params).toEqual({ key: "value" });
      expect(request.id).toBeTypeOf("number");

      // Send a response back
      const response: JsonRpcResponse = {
        jsonrpc: "2.0",
        id: request.id,
        result: { answer: 42 },
      };
      serverSocket.write(JSON.stringify(response) + "\n");

      const result = await responsePromise;
      expect(result.id).toBe(request.id);
      expect(result.result).toEqual({ answer: 42 });

      serverSocket.destroy();
    });

    it("should correctly match multiple concurrent requests to their responses", async () => {
      const connPromise = waitForConnection(tcpServer);
      await adapter.connect();
      const serverSocket = await connPromise;

      const received: string[] = [];
      serverSocket.on("data", (data: Buffer) => {
        const lines = data.toString().trim().split("\n");
        received.push(...lines);

        // Once we have both requests, respond in reverse order
        if (received.length >= 2) {
          const req1 = JSON.parse(received[0]);
          const req2 = JSON.parse(received[1]);

          // Respond to the second request first
          serverSocket.write(
            JSON.stringify({ jsonrpc: "2.0", id: req2.id, result: { from: "second" } }) + "\n",
          );
          serverSocket.write(
            JSON.stringify({ jsonrpc: "2.0", id: req1.id, result: { from: "first" } }) + "\n",
          );
        }
      });

      const [result1, result2] = await Promise.all([
        adapter.sendCommand("method.a", {}),
        adapter.sendCommand("method.b", {}),
      ]);

      expect(result1.result).toEqual({ from: "first" });
      expect(result2.result).toEqual({ from: "second" });

      serverSocket.destroy();
    });

    it("should handle error responses", async () => {
      const connPromise = waitForConnection(tcpServer);
      await adapter.connect();
      const serverSocket = await connPromise;

      serverSocket.on("data", (data: Buffer) => {
        const request = JSON.parse(data.toString().trim());
        serverSocket.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: request.id,
            error: { code: -32601, message: "Method not found" },
          }) + "\n",
        );
      });

      const result = await adapter.sendCommand("unknown.method", {});
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(-32601);
      expect(result.error!.message).toBe("Method not found");

      serverSocket.destroy();
    });

    it("should call onMessage for each received response", async () => {
      const connPromise = waitForConnection(tcpServer);
      await adapter.connect();
      const serverSocket = await connPromise;

      serverSocket.on("data", (data: Buffer) => {
        const request = JSON.parse(data.toString().trim());
        serverSocket.write(
          JSON.stringify({ jsonrpc: "2.0", id: request.id, result: "ok" }) + "\n",
        );
      });

      await adapter.sendCommand("test.ping", {});
      expect(adapter.receivedMessages).toHaveLength(1);
      expect(adapter.receivedMessages[0].result).toBe("ok");

      serverSocket.destroy();
    });

    it("should throw when sending a command while disconnected", async () => {
      await expect(adapter.sendCommand("test.method", {})).rejects.toThrow("Not connected");
    });
  });

  describe("timeout handling", () => {
    it("should reject a request that times out", async () => {
      const connPromise = waitForConnection(tcpServer);
      await adapter.connect();
      await connPromise;

      // Disable reconnect so afterEach cleanup does not hang
      adapter["shouldReconnect"] = false;

      // Set a very short timeout for testing
      adapter.setRequestTimeout(50);

      const promise = adapter.sendCommand("slow.method", {});
      // Do not send a response from the server

      await expect(promise).rejects.toThrow("timed out");
    });

    it("should clean up the pending request on timeout", async () => {
      const connPromise = waitForConnection(tcpServer);
      await adapter.connect();
      await connPromise;

      // Disable reconnect so afterEach cleanup does not hang
      adapter["shouldReconnect"] = false;

      adapter.setRequestTimeout(50);

      try {
        await adapter.sendCommand("slow.method", {});
      } catch {
        // Expected timeout
      }

      expect(adapter.getPending().size).toBe(0);
    });

    it("should reject all pending requests on disconnect", async () => {
      const connPromise = waitForConnection(tcpServer);
      await adapter.connect();
      const serverSocket = await connPromise;

      // Set a long timeout so the request does not time out before disconnect
      adapter.setRequestTimeout(30000);

      const promise = adapter.sendCommand("slow.method", {});

      // Disconnect should reject the pending request
      await adapter.disconnect();

      await expect(promise).rejects.toThrow("disconnecting");

      serverSocket.destroy();
    });
  });

  describe("buffer processing", () => {
    it("should handle multiple messages in a single data chunk", async () => {
      const connPromise = waitForConnection(tcpServer);
      await adapter.connect();
      const serverSocket = await connPromise;

      // We will send two commands, and the server will respond with both in one chunk
      const requests: any[] = [];
      serverSocket.on("data", (data: Buffer) => {
        const lines = data.toString().trim().split("\n");
        for (const line of lines) {
          requests.push(JSON.parse(line));
        }

        if (requests.length >= 2) {
          // Send both responses in a single write
          const resp1 = JSON.stringify({ jsonrpc: "2.0", id: requests[0].id, result: "a" });
          const resp2 = JSON.stringify({ jsonrpc: "2.0", id: requests[1].id, result: "b" });
          serverSocket.write(resp1 + "\n" + resp2 + "\n");
        }
      });

      const [r1, r2] = await Promise.all([
        adapter.sendCommand("m1", {}),
        adapter.sendCommand("m2", {}),
      ]);

      expect(r1.result).toBe("a");
      expect(r2.result).toBe("b");

      serverSocket.destroy();
    });

    it("should handle a response split across multiple data chunks", async () => {
      const connPromise = waitForConnection(tcpServer);
      await adapter.connect();
      const serverSocket = await connPromise;

      serverSocket.on("data", (data: Buffer) => {
        const request = JSON.parse(data.toString().trim());
        const fullResponse = JSON.stringify({ jsonrpc: "2.0", id: request.id, result: "split-ok" }) + "\n";

        // Send the response in two parts
        const mid = Math.floor(fullResponse.length / 2);
        serverSocket.write(fullResponse.substring(0, mid));
        setTimeout(() => {
          serverSocket.write(fullResponse.substring(mid));
        }, 20);
      });

      const result = await adapter.sendCommand("test.split", {});
      expect(result.result).toBe("split-ok");

      serverSocket.destroy();
    });
  });
});
