# LegacyOS

LegacyOS adalah dashboard family-office berbahasa Indonesia yang siap di-host sebagai situs statis di Vercel. AI Advisor dan pemindaian dokumen melewati Vercel Function + **Vercel AI Gateway**, sehingga kunci penyedia AI tidak pernah dikirim ke browser.

## Deploy ke Vercel

1. Impor repositori ini melalui **Vercel → Add New → Project**.
2. Pilih framework **Other** dan biarkan Root Directory tetap `./`. Build command dan output directory sudah dikunci lewat `vercel.json` (`npm run build` → `public`), jadi tidak perlu diubah manual.
3. Tambahkan Environment Variable (pilih salah satu cara autentikasi AI):

   **Disarankan — Vercel AI Gateway**

   ```text
   AI_GATEWAY_API_KEY=vck_...
   AI_MODEL=anthropic/claude-sonnet-4-6
   ```

   Buat kunci di **Vercel Dashboard → AI Gateway → API Keys**. Pada deployment Vercel, OIDC (`VERCEL_OIDC_TOKEN`) juga dapat dipakai otomatis tanpa kunci terpisah.

   **Alternatif — Anthropic langsung**

   ```text
   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=claude-sonnet-4-6
   ```

   `ANTHROPIC_MODEL` opsional dan dapat disesuaikan dengan model yang tersedia pada akun Anthropic Anda.
4. Tekan **Deploy**. Vercel akan menyajikan isi folder `public/` dan otomatis membuat function `/api/anthropic`.
5. Setelah domain produksi tersedia, opsional tambahkan:

   ```text
   ALLOWED_ORIGINS=https://domain-anda.com
   ```

   Beberapa origin dapat dipisahkan dengan koma. Domain Vercel aktif diterima otomatis.

Untuk deploy melalui CLI:

```bash
npx vercel
npx vercel --prod
```

## Menjalankan dan memeriksa

```bash
npm run check
npx vercel dev
```

`npm run check` memvalidasi HTML, JavaScript, konfigurasi Vercel, CSP, dan memastikan frontend tidak memuat kunci atau endpoint penyedia AI secara langsung.

## Struktur

- `public/index.html` — shell aplikasi yang semantik dan responsif.
- `public/styles.css` — tampilan LegacyOS tanpa ketergantungan font/CDN.
- `public/app.js` — seluruh modul, data demo, CRUD lokal, laporan, dan fallback analitik.
- `api/anthropic.mjs` — proxy server-side ke Vercel AI Gateway (atau Anthropic langsung) untuk AI Advisor dan ekstraksi dokumen.
- `vercel.json` — build/output directory, security headers, dan kebijakan cache.

## Batas keamanan yang perlu dipahami

- Login dan pemilih peran saat ini adalah **simulasi client-side**, bukan autentikasi produksi.
- Data aplikasi disimpan di `localStorage`, sehingga hanya tersedia pada browser/perangkat yang sama. Gunakan ekspor JSON untuk backup.
- Jangan memasukkan data keluarga nyata sebelum menambahkan autentikasi server-side, database terenkripsi, otorisasi per pengguna, audit log, dan object storage privat.
- Endpoint AI memiliki validasi origin, pembatasan ukuran, timeout, dan rate limit ringan. Deployment publik yang berisi data nyata tetap memerlukan autentikasi.
- Situs memakai `noindex,nofollow` dan `robots.txt` agar tautan publik tidak diindeks mesin pencari. Hapus keduanya hanya bila memang ingin situs ditemukan lewat pencarian.
