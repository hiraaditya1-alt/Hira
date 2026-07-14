import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";

const ROOT = process.cwd();
const CHROME = process.env.CHROME_PATH || "/usr/local/bin/google-chrome";

class CdpClient {
  constructor(url) {
    this.url = url;
    this.counter = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.exceptions = [];
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      if (message.method === "Runtime.exceptionThrown") {
        this.exceptions.push(message.params.exceptionDetails.text);
      }
      for (const listener of this.listeners.get(message.method) || []) listener(message.params);
    });
  }

  send(method, params = {}) {
    const id = ++this.counter;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method, timeout = 10_000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout menunggu ${method}`)), timeout);
      const listener = (params) => {
        clearTimeout(timer);
        this.listeners.set(method, (this.listeners.get(method) || []).filter((item) => item !== listener));
        resolve(params);
      };
      this.listeners.set(method, [...(this.listeners.get(method) || []), listener]);
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }

  close() {
    this.socket?.close();
  }
}

function staticServer() {
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
  };
  return http.createServer(async (request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    const files = {
      "/": "index.html",
      "/index.html": "index.html",
      "/styles.css": "styles.css",
      "/app.js": "app.js",
      "/favicon.svg": "favicon.svg",
      "/robots.txt": "robots.txt",
    };
    const file = files[pathname];
    if (!file) {
      response.writeHead(404).end("Not found");
      return;
    }
    const body = await readFile(path.join(ROOT, file));
    response.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(body);
  });
}

async function waitForDevTools(child) {
  let stderr = "";
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Chrome DevTools tidak aktif.\n${stderr}`)), 12_000);
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      const match = stderr.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
      if (match) {
        clearTimeout(timer);
        resolve(Number(match[1]));
      }
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome berhenti sebelum siap (${code}).\n${stderr}`));
    });
  });
}

test("LegacyOS loads and navigates in a real browser", { timeout: 35_000 }, async (context) => {
  try {
    await access(CHROME);
  } catch {
    context.skip(`Chrome tidak tersedia di ${CHROME}`);
    return;
  }

  const server = staticServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const profile = await mkdtemp(path.join(os.tmpdir(), "legacyos-chrome-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });

  let client;
  try {
    const debugPort = await waitForDevTools(chrome);
    const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
    const page = targets.find((target) => target.type === "page");
    assert.ok(page?.webSocketDebuggerUrl, "Target halaman Chrome harus tersedia");

    client = new CdpClient(page.webSocketDebuggerUrl);
    await client.connect();
    await Promise.all([
      client.send("Page.enable"),
      client.send("Runtime.enable"),
      client.send("Log.enable"),
    ]);
    const loaded = client.once("Page.loadEventFired");
    await client.send("Page.navigate", { url: baseUrl });
    await loaded;

    assert.equal(await client.evaluate("document.title"), "LegacyOS — Family Office Anda");
    assert.equal(await client.evaluate("document.querySelector('#login').hidden"), false);
    assert.equal(await client.evaluate("document.querySelector('#login-seal').textContent"), "W");

    await client.evaluate("document.querySelector('#login-form').requestSubmit()");
    await delay(400);
    const dashboard = await client.evaluate(`({
      appHidden: document.querySelector('#app').hidden,
      loginHidden: document.querySelector('#login').hidden,
      title: document.querySelector('#view .page-title')?.textContent,
      navCount: document.querySelectorAll('#nav .nav-item').length,
      panels: document.querySelectorAll('#view .panel').length
    })`);
    assert.deepEqual(dashboard, {
      appHidden: false,
      loginHidden: true,
      title: "Selamat datang, Keluarga Wijaya",
      navCount: 22,
      panels: 8,
    });

    await client.evaluate("document.querySelector('[data-module=\"assets\"]').click()");
    assert.equal(await client.evaluate("document.querySelector('#view .page-title').textContent"), "Asset Registry");
    assert.equal(await client.evaluate("document.querySelectorAll('.asset-card').length"), 10);
    await client.evaluate("document.querySelector('.asset-card').click()");
    assert.equal(await client.evaluate("document.querySelector('#modal-root').hidden"), false);
    assert.equal(await client.evaluate("document.querySelector('#modal-title').textContent"), "Menara Wijaya");
    await client.evaluate("document.querySelector('[data-action=\"modal-close\"]').click()");

    await client.evaluate(`(() => {
      const select = document.querySelector('#role-select');
      select.value = 'member';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    assert.equal(await client.evaluate("document.querySelector('#read-only-banner').hidden"), false);
    assert.equal(await client.evaluate("document.querySelectorAll('#nav .nav-item').length"), 9);

    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    assert.equal(await client.evaluate("getComputedStyle(document.querySelector('#menu-button')).display"), "grid");
    assert.equal(client.exceptions.length, 0, `Tidak boleh ada exception browser: ${client.exceptions.join(", ")}`);
  } finally {
    client?.close();
    chrome.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => chrome.once("exit", resolve)),
      delay(2_000),
    ]);
    server.close();
    await rm(profile, { recursive: true, force: true });
  }
});
