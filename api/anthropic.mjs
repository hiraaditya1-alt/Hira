import { getVercelOidcToken } from "@vercel/oidc";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const AI_GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_BODY_BYTES = 4_000_000;
const WINDOW_MS = 60_000;
const REQUESTS_PER_WINDOW = 20;
const buckets = new Map();

function gatewayProvider(token) {
  return {
    mode: "gateway",
    url: AI_GATEWAY_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-api-key": token,
      "anthropic-version": "2023-06-01",
    },
  };
}

async function readOidcToken() {
  // On Vercel, the short-lived token arrives via request context / header.
  // Locally (and in unit tests) only honor an explicit VERCEL_OIDC_TOKEN env var
  // so @vercel/oidc does not silently reload .env.local mid-test.
  if (process.env.VERCEL !== "1") return "";
  try {
    const token = await getVercelOidcToken();
    return token ? String(token).trim() : "";
  } catch {
    return "";
  }
}

const EXTRACTION_SYSTEM = `Anda adalah mesin ekstraksi dokumen keuangan untuk kantor keluarga Indonesia.
Balas HANYA dengan satu objek JSON valid, tanpa markdown atau teks tambahan, memakai skema:
{
  "type": "dividen|pemasukan|setoran|beban|pajak|capital_call|penarikan",
  "description": "ringkasan maksimal 70 karakter",
  "amount": 0,
  "date": "DD Mmm YYYY atau string kosong",
  "account": "saran nama rekening atau string kosong",
  "confidence": 0.0,
  "note": "catatan singkat atau string kosong"
}
amount wajib dalam MILIAR Rupiah. Konversi juta menjadi /1000, Rupiah menjadi /1.000.000.000,
dan USD menjadi Rupiah memakai kurs indikatif 16.450 sebelum dikonversi ke miliar.
Gunakan nilai absolut. Jika dokumen bukan transaksi finansial, amount=0 dan confidence<=0.2.`;

function json(response, status, body) {
  response.status(status);
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  return response.end(JSON.stringify(body));
}

function clientAddress(request) {
  const forwarded = request.headers["x-forwarded-for"];
  return String(Array.isArray(forwarded) ? forwarded[0] : forwarded || request.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

function rateLimited(request) {
  const now = Date.now();
  const key = clientAddress(request);
  const current = buckets.get(key);
  if (!current || now - current.startedAt > WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  if (buckets.size > 2_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (now - bucket.startedAt > WINDOW_MS) buckets.delete(bucketKey);
    }
  }
  return current.count > REQUESTS_PER_WINDOW;
}

function isAllowedOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const requestHost = String(request.headers["x-forwarded-host"] || request.headers.host || "").split(":")[0];
    const configured = String(process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => new URL(value).host);
    const vercelHost = process.env.VERCEL_URL;
    return originUrl.hostname === requestHost
      || originUrl.host === vercelHost
      || configured.includes(originUrl.host);
  } catch {
    return false;
  }
}

function bodySize(request) {
  const declared = Number(request.headers["content-length"] || 0);
  if (declared) return declared;
  try {
    return Buffer.byteLength(JSON.stringify(request.body || {}));
  } catch {
    return MAX_BODY_BYTES + 1;
  }
}

function parseBody(request) {
  if (request.body && typeof request.body === "object" && !Array.isArray(request.body)) return request.body;
  if (typeof request.body === "string") {
    try {
      const parsed = JSON.parse(request.body);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {
      // The generic invalid-request response below is intentional.
    }
  }
  const error = new Error("Body JSON tidak valid.");
  error.code = "INVALID_REQUEST";
  throw error;
}

function cleanMessages(input) {
  if (!Array.isArray(input)) return [];
  return input
    .slice(-12)
    .filter((message) => message && ["user", "assistant"].includes(message.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").slice(0, 4_000),
    }))
    .filter((message) => message.content.trim());
}

function cleanContext(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const serialized = JSON.stringify(input);
  if (serialized.length > 24_000) throw new Error("Konteks terlalu besar");
  return JSON.parse(serialized);
}

async function resolveProvider() {
  const gatewayKey = String(process.env.AI_GATEWAY_API_KEY || "").trim();
  if (gatewayKey) return gatewayProvider(gatewayKey);

  const oidcToken = String(process.env.VERCEL_OIDC_TOKEN || "").trim() || await readOidcToken();
  if (oidcToken) return gatewayProvider(oidcToken);

  const anthropicKey = String(process.env.ANTHROPIC_API_KEY || "").trim();
  if (anthropicKey) {
    return {
      mode: "anthropic",
      url: ANTHROPIC_URL,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
    };
  }
  const error = new Error("AI belum dikonfigurasi pada deployment ini. Set AI_GATEWAY_API_KEY (disarankan) atau ANTHROPIC_API_KEY.");
  error.code = "AI_NOT_CONFIGURED";
  throw error;
}

function resolveModel(mode) {
  const configured = String(process.env.AI_MODEL || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL).trim();
  if (mode === "gateway") {
    if (configured.includes("/")) return configured;
    return `anthropic/${configured}`;
  }
  return configured.includes("/") ? configured.split("/").pop() : configured;
}

async function callModel(payload) {
  const provider = await resolveProvider();
  const body = {
    ...payload,
    model: resolveModel(provider.mode),
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const upstream = await fetch(provider.url, {
      method: "POST",
      headers: provider.headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("AI upstream failed", provider.mode, upstream.status, result?.error?.type || result?.error?.message || "unknown");
      const error = new Error("Penyedia AI tidak dapat memproses permintaan.");
      error.code = "AI_UPSTREAM_ERROR";
      error.status = upstream.status;
      throw error;
    }
    const text = (result.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    if (!text) throw new Error("Penyedia AI mengembalikan jawaban kosong.");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

async function advisor(body) {
  const messages = cleanMessages(body.messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    const error = new Error("Pertanyaan pengguna wajib diisi.");
    error.code = "INVALID_REQUEST";
    throw error;
  }
  const context = cleanContext(body.context);
  const system = `Anda adalah AI Advisor pada LegacyOS, aplikasi kantor keluarga.
Jawab selalu dalam Bahasa Indonesia, analitis tetapi ringkas (maksimal 160 kata).
Format angka miliar Rupiah sebagai "Rp X M" dan ribuan miliar sebagai "Rp X,XX T".
Gunakan HANYA data dalam konteks JSON berikut; jangan mengarang saldo, aset, tenggat, atau pihak.
Jika data tidak tersedia, katakan dengan jelas. Pisahkan fakta dari simulasi.
Anda bukan penasihat investasi, pajak, atau hukum berlisensi; arahkan keputusan material ke komite atau penasihat profesional.
Konteks JSON:
${JSON.stringify(context)}`;
  const text = await callModel({
    max_tokens: 800,
    temperature: 0.2,
    system,
    messages,
  });
  return { text };
}

function parseExtraction(text) {
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  const parsed = JSON.parse(cleaned);
  const allowedTypes = new Set(["dividen", "pemasukan", "setoran", "beban", "pajak", "capital_call", "penarikan"]);
  return {
    type: allowedTypes.has(parsed.type) ? parsed.type : "pemasukan",
    description: String(parsed.description || "Dokumen dipindai").slice(0, 70),
    amount: Math.max(Number(parsed.amount || 0), 0),
    date: String(parsed.date || "").slice(0, 40),
    account: String(parsed.account || "").slice(0, 80),
    confidence: Math.max(0, Math.min(Number(parsed.confidence || 0), 1)),
    note: String(parsed.note || "").slice(0, 240),
  };
}

async function extract(body) {
  const text = typeof body.text === "string" ? body.text.slice(0, 80_000) : "";
  const file = body.file && typeof body.file === "object" ? body.file : null;
  if (!text.trim() && !file) {
    const error = new Error("Teks atau berkas wajib disertakan.");
    error.code = "INVALID_REQUEST";
    throw error;
  }
  let content;
  if (file) {
    const allowedMedia = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
    const mediaType = String(file.mediaType || "");
    const base64 = String(file.data || "");
    if (!allowedMedia.has(mediaType) || !base64 || base64.length > 3_600_000) {
      const error = new Error("Format atau ukuran berkas tidak didukung.");
      error.code = "INVALID_FILE";
      throw error;
    }
    const source = { type: "base64", media_type: mediaType, data: base64 };
    content = [
      mediaType === "application/pdf" ? { type: "document", source } : { type: "image", source },
      { type: "text", text: "Ekstrak transaksi utama dari dokumen ini sesuai skema." },
    ];
  } else {
    content = `Ekstrak transaksi utama dari teks berikut sesuai skema:\n---\n${text}`;
  }
  const result = await callModel({
    max_tokens: 700,
    temperature: 0,
    system: EXTRACTION_SYSTEM,
    messages: [{ role: "user", content }],
  });
  return { data: parseExtraction(result) };
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { error: "Metode tidak diizinkan." });
  }
  if (!isAllowedOrigin(request)) return json(response, 403, { error: "Origin tidak diizinkan." });
  if (rateLimited(request)) return json(response, 429, { error: "Terlalu banyak permintaan. Coba lagi sebentar." });
  if (bodySize(request) > MAX_BODY_BYTES) return json(response, 413, { error: "Permintaan terlalu besar." });

  try {
    const body = parseBody(request);
    if (body.action === "advisor") return json(response, 200, await advisor(body));
    if (body.action === "extract") return json(response, 200, await extract(body));
    return json(response, 400, { error: "Aksi tidak dikenali." });
  } catch (error) {
    const status = error.code === "AI_NOT_CONFIGURED" ? 503
      : error.code?.startsWith("INVALID") ? 400
        : error.name === "AbortError" ? 504
          : 502;
    if (status >= 500 && error.code !== "AI_NOT_CONFIGURED") console.error("LegacyOS AI route error", error);
    return json(response, status, { error: error.message || "Permintaan AI gagal.", code: error.code || "AI_ERROR" });
  }
}

export { resolveProvider, resolveModel, AI_GATEWAY_URL, ANTHROPIC_URL };
