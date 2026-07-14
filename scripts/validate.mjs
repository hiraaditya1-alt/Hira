import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const required = [
  "index.html",
  "styles.css",
  "app.js",
  "favicon.svg",
  "robots.txt",
  "vercel.json",
  "api/anthropic.mjs",
];

const failures = [];

for (const file of required) {
  try {
    await access(path.join(root, file), constants.R_OK);
  } catch {
    failures.push(`Berkas wajib tidak ditemukan: ${file}`);
  }
}

const read = (file) => readFile(path.join(root, file), "utf8");
const [html, css, app, api, vercelRaw] = await Promise.all([
  read("index.html"),
  read("styles.css"),
  read("app.js"),
  read("api/anthropic.mjs"),
  read("vercel.json"),
]);

if (!/^<!doctype html>/i.test(html)) failures.push("index.html tidak memiliki doctype HTML.");
if (!html.includes('lang="id"')) failures.push("Bahasa dokumen harus ditetapkan ke id.");
if (!html.includes('name="viewport"')) failures.push("Meta viewport tidak ditemukan.");
if (!html.includes('src="/app.js"')) failures.push("index.html tidak memuat /app.js.");
if (!html.includes('href="/styles.css"')) failures.push("index.html tidak memuat /styles.css.");
if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) failures.push("Inline script tidak diizinkan.");
if (/<[^>]+\son\w+=/i.test(html)) failures.push("Inline event handler tidak diizinkan.");
if (!css.includes("@media (max-width: 880px)")) failures.push("Breakpoint navigasi mobile tidak ditemukan.");

try {
  // Compile only; the browser code is not executed in Node.
  new Function(app);
} catch (error) {
  failures.push(`Sintaks app.js tidak valid: ${error.message}`);
}

for (const forbidden of ["api.anthropic.com", "x-api-key", "anthropic-dangerous-direct-browser-access"]) {
  if (app.includes(forbidden)) failures.push(`Rahasia/provider endpoint bocor ke app.js: ${forbidden}`);
}
if (!app.includes('fetch("/api/anthropic"')) failures.push("Frontend tidak memakai proxy /api/anthropic.");
if (!api.includes("process.env.ANTHROPIC_API_KEY")) failures.push("API route tidak membaca ANTHROPIC_API_KEY dari environment.");
if (!api.includes("MAX_BODY_BYTES")) failures.push("API route tidak membatasi ukuran body.");
if (!api.includes("rateLimited")) failures.push("API route tidak memiliki rate limiter.");

try {
  const config = JSON.parse(vercelRaw);
  if (config.framework !== null) failures.push("Vercel framework harus null untuk proyek statis ini.");
  if (!Array.isArray(config.headers) || config.headers.length === 0) failures.push("Security headers Vercel tidak ditemukan.");
  if (!vercelRaw.includes("Content-Security-Policy")) failures.push("Content-Security-Policy tidak dikonfigurasi.");
} catch (error) {
  failures.push(`vercel.json tidak valid: ${error.message}`);
}

if (failures.length) {
  console.error(`Validasi gagal (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`LegacyOS valid: ${required.length} berkas wajib, CSP aktif, proxy AI server-side.`);
