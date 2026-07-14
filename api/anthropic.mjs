const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MAX_BODY_BYTES = 4_000_000;
const WINDOW_MS = 60_000;
const REQUESTS_PER_WINDOW = 20;
const buckets = new Map();

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

async function callAnthropic(payload) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const error = new Error("AI belum dikonfigurasi pada deployment ini.");
    error.code = "AI_NOT_CONFIGURED";
    throw error;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("Anthropic request failed", upstream.status, result?.error?.type || "unknown");
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
  const text = await callAnthropic({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
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
  const result = await callAnthropic({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
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

  const body = request.body && typeof request.body === "object" ? request.body : {};
  try {
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
