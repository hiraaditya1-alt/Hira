import assert from "node:assert/strict";
import test from "node:test";

import handler from "../api/anthropic.mjs";

function request(overrides = {}) {
  return {
    method: "POST",
    headers: {
      host: "legacy.test",
      origin: "https://legacy.test",
      "content-type": "application/json",
      ...overrides.headers,
    },
    body: overrides.body || {},
    socket: { remoteAddress: overrides.ip || `127.0.0.${Math.floor(Math.random() * 200) + 1}` },
    ...overrides,
  };
}

function response() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
    },
    end(value = "") {
      this.payload = value ? JSON.parse(value) : null;
      return this;
    },
  };
}

test("API only accepts POST", async () => {
  const res = response();
  await handler(request({ method: "GET" }), res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, "POST");
});

test("API rejects a foreign browser origin", async () => {
  const res = response();
  await handler(request({ headers: { host: "legacy.test", origin: "https://attacker.example" } }), res);
  assert.equal(res.statusCode, 403);
  assert.match(res.payload.error, /Origin/);
});

test("advisor reports missing server-side configuration without leaking secrets", async () => {
  const previous = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  const res = response();
  try {
    await handler(request({
      body: {
        action: "advisor",
        messages: [{ role: "user", content: "Ringkas posisi." }],
        context: { netWorth: 100 },
      },
    }), res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.payload.code, "AI_NOT_CONFIGURED");
    assert.doesNotMatch(JSON.stringify(res.payload), /sk-ant/i);
  } finally {
    if (previous) process.env.ANTHROPIC_API_KEY = previous;
  }
});

test("advisor proxies a bounded request and returns text", async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "test-key-not-a-secret";
  let upstream;
  globalThis.fetch = async (url, options) => {
    upstream = { url, options, body: JSON.parse(options.body) };
    return new Response(JSON.stringify({
      content: [{ type: "text", text: "Posisi likuiditas berada dalam batas kebijakan." }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const res = response();
  try {
    await handler(request({
      body: {
        action: "advisor",
        messages: [{ role: "user", content: "Bagaimana likuiditas?" }],
        context: { netWorth: 1000, cash: 200, allocation: [] },
      },
    }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.text, "Posisi likuiditas berada dalam batas kebijakan.");
    assert.equal(upstream.url, "https://api.anthropic.com/v1/messages");
    assert.equal(upstream.options.headers["x-api-key"], "test-key-not-a-secret");
    assert.equal(upstream.body.temperature, 0.2);
    assert.match(upstream.body.system, /"cash":200/);
    assert.equal(res.headers["cache-control"], "no-store");
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey) process.env.ANTHROPIC_API_KEY = previousKey;
    else delete process.env.ANTHROPIC_API_KEY;
  }
});

test("document extraction normalizes provider JSON", async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "test-key-not-a-secret";
  globalThis.fetch = async () => new Response(JSON.stringify({
    content: [{
      type: "text",
      text: '{"type":"dividen","description":"Dividen interim","amount":14.4,"date":"11 Jul 2026","account":"BCA","confidence":0.92,"note":""}',
    }],
  }), { status: 200, headers: { "Content-Type": "application/json" } });
  const res = response();
  try {
    await handler(request({
      body: { action: "extract", text: "Dividen Rp 14.400.000.000" },
    }), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload.data, {
      type: "dividen",
      description: "Dividen interim",
      amount: 14.4,
      date: "11 Jul 2026",
      account: "BCA",
      confidence: 0.92,
      note: "",
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey) process.env.ANTHROPIC_API_KEY = previousKey;
    else delete process.env.ANTHROPIC_API_KEY;
  }
});
