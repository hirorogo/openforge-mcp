import * as net from "node:net";
import { EventEmitter } from "node:events";

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface PendingRequest {
  resolve: (value: JsonRpcResponse) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export abstract class BaseAdapter extends EventEmitter {
  protected socket: net.Socket | null = null;
  protected host: string;
  protected port: number;
  protected connected: boolean = false;
  protected reconnecting: boolean = false;
  protected requestId: number = 0;
  protected pending: Map<number, PendingRequest> = new Map();
  protected receiveBuffer: string = "";
  protected reconnectDelay: number = 2000;
  protected maxReconnectDelay: number = 30000;
  protected currentReconnectDelay: number = 2000;
  protected reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  protected shouldReconnect: boolean = true;
  protected requestTimeout: number = 30000;

  constructor(
    public readonly targetName: string,
    port: number,
    host: string = "127.0.0.1",
  ) {
    super();
    this.port = port;
    this.host = host;
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();

      const onError = (err: Error) => {
        this.socket?.removeListener("error", onError);
        reject(err);
      };

      this.socket.once("error", onError);

      this.socket.connect(this.port, this.host, () => {
        this.socket?.removeListener("error", onError);
        this.connected = true;
        this.currentReconnectDelay = this.reconnectDelay;
        this.setupSocketHandlers();
        this.emit("connected");
        resolve();
      });
    });
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.on("data", (data: Buffer) => {
      this.receiveBuffer += data.toString("utf-8");
      this.processBuffer();
    });

    this.socket.on("close", () => {
      this.connected = false;
      this.rejectAllPending(new Error(`Connection to ${this.targetName} closed`));
      this.emit("disconnected");
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    });

    this.socket.on("error", (err: Error) => {
      this.emit("error", err);
    });
  }

  private processBuffer(): void {
    // Protocol: newline-delimited JSON
    let newlineIndex: number;
    while ((newlineIndex = this.receiveBuffer.indexOf("\n")) !== -1) {
      const line = this.receiveBuffer.substring(0, newlineIndex).trim();
      this.receiveBuffer = this.receiveBuffer.substring(newlineIndex + 1);
      if (line.length === 0) continue;

      try {
        const message = JSON.parse(line) as JsonRpcResponse;
        this.handleMessage(message);
      } catch {
        this.emit("error", new Error(`Failed to parse message from ${this.targetName}: ${line}`));
      }
    }
  }

  private handleMessage(message: JsonRpcResponse): void {
    if (message.id !== undefined) {
      const pending = this.pending.get(message.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pending.delete(message.id);
        pending.resolve(message);
      }
    }
    this.onMessage(message);
  }

  private scheduleReconnect(): void {
    if (this.reconnecting) return;
    this.reconnecting = true;

    this.reconnectTimer = setTimeout(async () => {
      this.reconnecting = false;
      try {
        await this.connect();
      } catch {
        this.currentReconnectDelay = Math.min(
          this.currentReconnectDelay * 2,
          this.maxReconnectDelay,
        );
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      }
    }, this.currentReconnectDelay);
  }

  private rejectAllPending(error: Error): void {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
      this.pending.delete(id);
    }
  }

  async disconnect(): Promise<void> {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.rejectAllPending(new Error("Adapter disconnecting"));
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async sendCommand(method: string, params?: Record<string, unknown>): Promise<JsonRpcResponse> {
    if (!this.connected || !this.socket) {
      throw new Error(`Not connected to ${this.targetName}`);
    }

    const id = ++this.requestId;
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request ${method} to ${this.targetName} timed out after ${this.requestTimeout}ms`));
      }, this.requestTimeout);

      this.pending.set(id, { resolve, reject, timer });

      const payload = JSON.stringify(request) + "\n";
      this.socket!.write(payload, (err) => {
        if (err) {
          clearTimeout(timer);
          this.pending.delete(id);
          reject(err);
        }
      });
    });
  }

  protected onMessage(_message: JsonRpcResponse): void {
    // Override in subclasses to handle notifications or unsolicited messages
  }
}
