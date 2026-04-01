import http from "node:http";
import { ToolRegistry } from "./registry.js";
import { OperationLog } from "./operation-log.js";
import { UnityAdapter } from "./adapters/unity.js";
import { BlenderAdapter } from "./adapters/blender.js";
import { GodotAdapter } from "./adapters/godot.js";
import { TransactionManager } from "./transaction.js";

export interface DashboardOptions {
  registry: ToolRegistry;
  operationLog: OperationLog;
  unityAdapter: UnityAdapter;
  blenderAdapter: BlenderAdapter;
  godotAdapter: GodotAdapter;
  transactionManager: TransactionManager;
}

function generateQrSvg(text: string): string {
  const size = 148;
  const cellSize = 4;
  const cells = Math.floor(size / cellSize);

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }

  const rects: string[] = [];

  const finderPositions = [
    [0, 0],
    [cells - 7, 0],
    [0, cells - 7],
  ];
  for (const [fx, fy] of finderPositions) {
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        const isEdge = dx === 0 || dx === 6 || dy === 0 || dy === 6;
        const isInner = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        if (isEdge || isInner) {
          rects.push(
            `<rect x="${(fx + dx) * cellSize}" y="${(fy + dy) * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`,
          );
        }
      }
    }
  }

  let seed = Math.abs(hash);
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      if (
        (x < 8 && y < 8) ||
        (x >= cells - 8 && y < 8) ||
        (x < 8 && y >= cells - 8)
      ) {
        continue;
      }
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      if (seed % 3 === 0) {
        rects.push(
          `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`,
        );
      }
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`,
    `<rect width="${size}" height="${size}" fill="#fff"/>`,
    ...rects,
    `</svg>`,
  ].join("");
}

function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OpenForge Dashboard</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: "Courier New", Courier, monospace;
  font-size: 13px;
  background: #f5f5f5;
  color: #222;
  padding: 16px;
}
h1 { font-size: 18px; margin-bottom: 12px; }
h2 { font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #999; padding-bottom: 4px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.panel {
  background: #fff;
  border: 1px solid #ccc;
  padding: 12px;
}
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { text-align: left; padding: 4px 8px; border-bottom: 1px solid #eee; }
th { background: #f0f0f0; font-weight: bold; }
.status-connected { color: #080; }
.status-disconnected { color: #a00; }
.result-success { color: #080; }
.result-fail { color: #a00; }
.stats-row { display: flex; gap: 24px; margin-bottom: 8px; }
.stats-row span { display: inline-block; }
.stats-label { color: #666; }
.log-table-container { max-height: 320px; overflow-y: auto; }
#screenshot-preview { max-width: 100%; max-height: 200px; border: 1px solid #ccc; display: none; }
#qr-container { text-align: center; padding: 8px; }
#qr-container svg { display: inline-block; }
#qr-url { font-size: 11px; color: #666; margin-top: 4px; word-break: break-all; }
.fullwidth { grid-column: 1 / -1; }
#sse-indicator { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #a00; margin-right: 6px; vertical-align: middle; }
#sse-indicator.live { background: #080; }
</style>
</head>
<body>
<h1><span id="sse-indicator"></span>OpenForge Dashboard</h1>

<div class="grid">
  <div class="panel">
    <h2>Connections</h2>
    <table>
      <tr><th>Target</th><th>Status</th></tr>
      <tr><td>Unity</td><td id="conn-unity" class="status-disconnected">disconnected</td></tr>
      <tr><td>Blender</td><td id="conn-blender" class="status-disconnected">disconnected</td></tr>
      <tr><td>Godot</td><td id="conn-godot" class="status-disconnected">disconnected</td></tr>
    </table>
    <div style="margin-top:8px">
      <span class="stats-label">Mode:</span> <span id="current-mode">--</span>
    </div>
  </div>

  <div class="panel">
    <h2>Statistics</h2>
    <div class="stats-row">
      <span><span class="stats-label">Total:</span> <span id="stat-total">0</span></span>
      <span><span class="stats-label">OK:</span> <span id="stat-ok" class="result-success">0</span></span>
      <span><span class="stats-label">Fail:</span> <span id="stat-fail" class="result-fail">0</span></span>
    </div>
    <div class="stats-row">
      <span><span class="stats-label">Avg Duration:</span> <span id="stat-avg">0</span>ms</span>
    </div>
    <h2 style="margin-top:8px">Transaction</h2>
    <div id="transaction-info">No active transaction</div>
  </div>

  <div class="panel">
    <h2>Screenshot Preview</h2>
    <img id="screenshot-preview" alt="screenshot">
    <div id="no-screenshot">No screenshot available</div>
  </div>

  <div class="panel">
    <h2>Mobile Access (QR)</h2>
    <div id="qr-container"></div>
    <div id="qr-url"></div>
  </div>

  <div class="panel fullwidth">
    <h2>Recent Operations (last 20)</h2>
    <div class="log-table-container">
      <table id="log-table">
        <thead>
          <tr><th>Time</th><th>Tool</th><th>Target</th><th>Result</th><th>Duration</th></tr>
        </thead>
        <tbody id="log-body"></tbody>
      </table>
    </div>
  </div>
</div>

<script>
(function() {
  var sseIndicator = document.getElementById("sse-indicator");

  function connectSSE() {
    var es = new EventSource("/ws");
    es.onopen = function() { sseIndicator.className = "live"; };
    es.onerror = function() { sseIndicator.className = ""; };
    es.addEventListener("status", function(evt) {
      try { updateStatus(JSON.parse(evt.data)); } catch(e) {}
    });
    es.addEventListener("log", function(evt) {
      try { updateLog(JSON.parse(evt.data)); } catch(e) {}
    });
  }

  function updateStatus(d) {
    setConn("conn-unity", d.connections.unity);
    setConn("conn-blender", d.connections.blender);
    setConn("conn-godot", d.connections.godot);
    document.getElementById("current-mode").textContent = d.mode || "--";
    document.getElementById("stat-total").textContent = d.stats.total;
    document.getElementById("stat-ok").textContent = d.stats.successful;
    document.getElementById("stat-fail").textContent = d.stats.failed;
    document.getElementById("stat-avg").textContent = Math.round(d.stats.averageDuration);
    if (d.transaction) {
      document.getElementById("transaction-info").textContent =
        "Active: " + d.transaction.label + " (" + d.transaction.operationCount + " ops)";
    } else {
      document.getElementById("transaction-info").textContent = "No active transaction";
    }
    if (d.screenshot) {
      var img = document.getElementById("screenshot-preview");
      img.src = "data:image/png;base64," + d.screenshot;
      img.style.display = "block";
      document.getElementById("no-screenshot").style.display = "none";
    }
  }

  function updateLog(entries) {
    var tbody = document.getElementById("log-body");
    tbody.innerHTML = "";
    for (var i = entries.length - 1; i >= 0; i--) {
      var e = entries[i];
      var tr = document.createElement("tr");
      var d = new Date(e.timestamp);
      var time = d.toLocaleTimeString();
      var cls = e.success ? "result-success" : "result-fail";
      var result = e.success ? "OK" : (e.error || "FAIL");
      tr.innerHTML = "<td>" + time + "</td><td>" + esc(e.tool) + "</td><td>" +
        esc(e.target) + '</td><td class="' + cls + '">' + esc(result) +
        "</td><td>" + e.duration + "ms</td>";
      tbody.appendChild(tr);
    }
  }

  function setConn(id, connected) {
    var el = document.getElementById(id);
    el.textContent = connected ? "connected" : "disconnected";
    el.className = connected ? "status-connected" : "status-disconnected";
  }

  function esc(s) {
    if (!s) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function initQr() {
    var url = location.href;
    document.getElementById("qr-url").textContent = url;
    fetch("/api/dashboard/qr?url=" + encodeURIComponent(url))
      .then(function(r) { return r.text(); })
      .then(function(svg) { document.getElementById("qr-container").innerHTML = svg; })
      .catch(function() {});
  }

  fetch("/api/dashboard/status")
    .then(function(r) { return r.json(); })
    .then(function(d) { updateStatus(d); })
    .catch(function() {});

  fetch("/api/dashboard/log")
    .then(function(r) { return r.json(); })
    .then(function(d) { updateLog(d.entries); })
    .catch(function() {});

  initQr();
  connectSSE();
})();
</script>
</body>
</html>`;
}

function sendJson(res: http.ServerResponse, statusCode: number, data: unknown): void {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body).toString(),
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

function sendHtml(res: http.ServerResponse, html: string): void {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(html).toString(),
  });
  res.end(html);
}

function sendSvg(res: http.ServerResponse, svg: string): void {
  res.writeHead(200, {
    "Content-Type": "image/svg+xml",
    "Content-Length": Buffer.byteLength(svg).toString(),
    "Access-Control-Allow-Origin": "*",
  });
  res.end(svg);
}

export class Dashboard {
  private options: DashboardOptions;
  private httpServer: http.Server | null = null;
  private sseClients: Set<http.ServerResponse> = new Set();
  private broadcastInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: DashboardOptions) {
    this.options = options;
  }

  private getStatusPayload(): Record<string, unknown> {
    const { registry, operationLog, unityAdapter, blenderAdapter, godotAdapter, transactionManager } =
      this.options;

    const txn = transactionManager.getTransaction();

    return {
      connections: {
        unity: unityAdapter.isConnected(),
        blender: blenderAdapter.isConnected(),
        godot: godotAdapter.isConnected(),
      },
      mode: registry.getMode(),
      stats: operationLog.getStats(),
      transaction: txn
        ? { label: txn.label, operationCount: txn.operations.length }
        : null,
      screenshot: null,
    };
  }

  private sendSSE(res: http.ServerResponse, event: string, data: unknown): void {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      this.sseClients.delete(res);
    }
  }

  start(port: number = 19821): void {
    const { operationLog } = this.options;

    this.httpServer = http.createServer((req, res) => {
      const url = req.url ?? "/";
      const qIndex = url.indexOf("?");
      const pathname = qIndex === -1 ? url : url.substring(0, qIndex);
      const queryString = qIndex === -1 ? "" : url.substring(qIndex + 1);

      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        });
        res.end();
        return;
      }

      if (req.method === "GET" && pathname === "/") {
        sendHtml(res, getDashboardHtml());
        return;
      }

      if (req.method === "GET" && pathname === "/api/dashboard/status") {
        sendJson(res, 200, this.getStatusPayload());
        return;
      }

      if (req.method === "GET" && pathname === "/api/dashboard/log") {
        const entries = operationLog.getRecent(20);
        sendJson(res, 200, { entries });
        return;
      }

      if (req.method === "GET" && pathname === "/api/dashboard/qr") {
        const params = new URLSearchParams(queryString);
        const qrUrl = params.get("url") || `http://localhost:${port}`;
        sendSvg(res, generateQrSvg(qrUrl));
        return;
      }

      // SSE endpoint for live updates
      if (req.method === "GET" && pathname === "/ws") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
        });
        res.write("\n");

        this.sseClients.add(res);

        // Send initial state
        this.sendSSE(res, "status", this.getStatusPayload());
        this.sendSSE(res, "log", operationLog.getRecent(20));

        req.on("close", () => {
          this.sseClients.delete(res);
        });
        return;
      }

      sendJson(res, 404, { error: `Not found: ${req.method} ${pathname}` });
    });

    // Broadcast status updates periodically
    this.broadcastInterval = setInterval(() => {
      if (this.sseClients.size === 0) return;
      const status = this.getStatusPayload();
      const log = operationLog.getRecent(20);
      for (const client of this.sseClients) {
        this.sendSSE(client, "status", status);
        this.sendSSE(client, "log", log);
      }
    }, 2000);

    this.httpServer.listen(port, () => {
      process.stderr.write(`OpenForge Dashboard listening on http://localhost:${port}\n`);
    });
  }

  stop(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
    for (const client of this.sseClients) {
      try { client.end(); } catch { /* ignore */ }
    }
    this.sseClients.clear();
    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
    }
  }
}
