(() => {
  "use strict";

  const STORAGE_KEY = "legacyos:vercel:v1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[character]);

  const ICONS = {
    dash: "▦",
    assets: "◇",
    banking: "▤",
    analytics: "⌁",
    tax: "§",
    liab: "⚖",
    tree: "♧",
    struct: "⌘",
    invest: "↗",
    board: "♙",
    constitution: "▥",
    succession: "⇢",
    estate: "♢",
    giving: "♡",
    vault: "▣",
    edu: "⌂",
    comms: "◌",
    insurance: "☂",
    security: "⬡",
    ai: "✦",
    reports: "▧",
    data: "⌗",
  };

  const MODULES = [
    { group: "Ikhtisar" },
    { id: "dash", label: "Dashboard" },
    { group: "Kekayaan" },
    { id: "assets", label: "Asset Registry" },
    { id: "banking", label: "Banking & Treasury" },
    { id: "analytics", label: "Portfolio Analytics" },
    { id: "tax", label: "Tax Center" },
    { id: "liab", label: "Kewajiban & Leverage" },
    { group: "Tata Kelola" },
    { id: "tree", label: "Family Tree" },
    { id: "struct", label: "Ownership Structure" },
    { id: "invest", label: "Investment Committee" },
    { id: "board", label: "Board Meeting" },
    { id: "constitution", label: "Family Constitution" },
    { id: "succession", label: "Succession Planning" },
    { id: "estate", label: "Estate Planning" },
    { id: "giving", label: "Filantropi — Yayasan" },
    { group: "Operasional" },
    { id: "vault", label: "Document Vault" },
    { id: "edu", label: "Family Education" },
    { id: "comms", label: "Communication" },
    { id: "insurance", label: "Asuransi & Risiko" },
    { id: "security", label: "Keamanan & Akses" },
    { group: "Intelijen" },
    { id: "ai", label: "AI Advisor" },
    { id: "reports", label: "Pelaporan" },
    { id: "data", label: "Pusat Data & Pindai" },
  ];

  const ROLES = {
    council: { label: "Family Council", initials: "FC", allow: "*", edit: true, vote: true },
    cio: {
      label: "CIO — Investasi",
      initials: "CI",
      allow: ["dash", "assets", "banking", "analytics", "liab", "invest", "board", "vault", "ai", "reports", "data"],
      edit: true,
      vote: true,
    },
    cfo: {
      label: "CFO Office",
      initials: "CF",
      allow: ["dash", "assets", "banking", "analytics", "tax", "liab", "vault", "insurance", "ai", "reports", "data"],
      edit: true,
      vote: false,
    },
    legal: {
      label: "Penasihat Hukum — read-only",
      initials: "LG",
      allow: ["struct", "board", "constitution", "estate", "vault", "insurance", "comms"],
      edit: false,
      vote: false,
    },
    member: {
      label: "Anggota Keluarga — read-only",
      initials: "AK",
      allow: ["dash", "assets", "tree", "constitution", "succession", "giving", "edu", "comms", "reports"],
      edit: false,
      vote: false,
    },
    youth: {
      label: "Generasi Muda",
      initials: "GM",
      allow: ["tree", "giving", "edu", "comms"],
      edit: false,
      vote: false,
    },
  };

  const DEFAULT_DATA = {
    mode: "demo",
    profile: { family: "Keluarga Wijaya", currencyRate: 16450 },
    ytd: 8.7,
    benchmark: 5.2,
    perf: [15.2, 15.4, 15.1, 15.8, 16.1, 16.6, 16.3, 17.0, 17.4, 17.2, 17.8, 18.1, 18.0, 18.5, 18.75],
    benchmarkPerf: [15.2, 15.3, 15.2, 15.5, 15.7, 15.9, 15.8, 16.1, 16.3, 16.2, 16.5, 16.7, 16.6, 16.9, 17.0],
    assets: [
      { id: "a1", category: "Real Estat", name: "Menara Wijaya", location: "SCBD, Jakarta", owner: "PT Wijaya Investama", value: 1850, risk: "Rendah", note: "Okupansi 91% · yield 6,5%" },
      { id: "a2", category: "Real Estat", name: "Villa Uluwatu", location: "Bali, Indonesia", owner: "PT Wijaya Investama", value: 250, risk: "Rendah", note: "Yield sewa 8,0%" },
      { id: "a3", category: "Real Estat", name: "Land Bank BSD", location: "Tangerang", owner: "PT Wijaya Investama", value: 620, risk: "Menengah", note: "42 ha · rencana JV 2028" },
      { id: "a4", category: "Perusahaan", name: "PT ABC Manufaktur", location: "Indonesia", owner: "PT Wijaya Investama", value: 4200, risk: "Menengah", note: "68% · EBITDA Rp 1,2 T" },
      { id: "a5", category: "Perusahaan", name: "PT Nusantara Retailindo", location: "Indonesia", owner: "PT Wijaya Investama", value: 1650, risk: "Menengah", note: "74% · 212 gerai" },
      { id: "a6", category: "Investasi Privat", name: "Alpha SEA Ventures III", location: "VC Fund · Vintage 2023", owner: "Wijaya Family Trust", value: 340, risk: "Tinggi", note: "TVPI 1,6× · IRR 21%" },
      { id: "a7", category: "Pasar Publik", name: "Portofolio Ekuitas IDX", location: "BCA, TLKM, ASII, dll.", owner: "PT Wijaya Investama", value: 1200, risk: "Menengah", note: "YTD +9,4%" },
      { id: "a8", category: "Pasar Publik", name: "Ekuitas Global", location: "UBS Custody", owner: "Wijaya Capital Pte Ltd", value: 900, risk: "Menengah", note: "YTD +11,2% (USD)" },
      { id: "a9", category: "Pasar Publik", name: "Obligasi & Sukuk", location: "INDON, FR, SGD bonds", owner: "Trust & Investama", value: 1088, risk: "Rendah", note: "YTM rata-rata 5,8%" },
      { id: "a10", category: "Alternatif", name: "Emas Batangan 180 kg", location: "Vault Singapura", owner: "Wijaya Family Trust", value: 288, risk: "Rendah", note: "Sertifikat LBMA" },
    ],
    banks: [
      { id: "b1", bank: "BCA Prioritas", purpose: "Operasional keluarga", currency: "IDR", balance: 850, account: "•• 8842" },
      { id: "b2", bank: "Bank Mandiri", purpose: "Escrow dividen & pajak", currency: "IDR", balance: 420, account: "•• 1207" },
      { id: "b3", bank: "DBS Singapore", purpose: "Treasury SGD", currency: "SGD", balance: 540, account: "•• 6631" },
      { id: "b4", bank: "UBS Zurich", purpose: "Custody & cash USD", currency: "USD", balance: 1475, account: "•• 0954" },
      { id: "b5", bank: "Citibank N.A.", purpose: "Deposito berjangka", currency: "USD", balance: 90, account: "•• 4419" },
    ],
    liabilities: [
      { id: "l1", facility: "Sindikasi Menara Wijaya", lender: "BCA + 2 bank", amount: 830, rate: "7,9% tetap", due: "2029", covenant: "LTV 45% (maks 60%)", status: "Aman" },
      { id: "l2", facility: "Working Capital PT ABC", lender: "Mandiri", amount: 600, rate: "8,4% mengambang", due: "2027", covenant: "DSCR 2,4×", status: "Review" },
      { id: "l3", facility: "Mortgage Properti SG", lender: "DBS", amount: 320, rate: "3,8%", due: "2031", covenant: "LTV 38%", status: "Aman" },
      { id: "l4", facility: "Pembiayaan Jet", lender: "Global Jet Capital", amount: 260, rate: "6,2%", due: "2028", covenant: "—", status: "Aman" },
      { id: "l5", facility: "Fasilitas Konstruksi", lender: "BNI", amount: 170, rate: "9,0%", due: "2027", covenant: "Drawdown 62%", status: "Aman" },
    ],
    commitments: [
      { fund: "Alpha Growth Fund III", committed: 400, drawn: 340, next: "Sep 2026" },
      { fund: "SEA Growth II", committed: 550, drawn: 470, next: "Nov 2026" },
      { fund: "Venture Nusantara I", committed: 420, drawn: 250, next: "Q1 2027" },
    ],
    transactions: [
      { id: "t1", date: "11 Jul 2026", type: "dividen", description: "Dividen interim PT ABC", account: "BCA Prioritas", amount: 14.4, direction: 1, source: "pindai" },
      { id: "t2", date: "08 Jul 2026", type: "beban", description: "Premi asuransi properti", account: "Bank Mandiri", amount: 2.1, direction: -1, source: "manual" },
    ],
    events: [
      { date: "15 Jul", title: "PPh 25 PT ABC", detail: "Rp 14 M · escrow siap", module: "tax" },
      { date: "24 Jul", title: "Rapat Dewan Q3", detail: "14:00 WIB · hybrid", module: "board" },
      { date: "31 Jul", title: "Penutupan voting Fund IV", detail: "3/10 suara masuk", module: "invest" },
      { date: "01 Agu", title: "Distribusi dividen keluarga", detail: "Rp 72 M · 9 rekening", module: "banking" },
      { date: "15 Agu", title: "Renewal asuransi kesehatan", detail: "13 tertanggung", module: "insurance" },
    ],
    taxes: [
      { due: "15 Jul 2026", title: "PPh 25", entity: "PT ABC Manufaktur", amount: 14, status: "Menunggu" },
      { due: "30 Nov 2026", title: "IRAS Form C", entity: "Wijaya Capital Pte Ltd", amount: 22, status: "Terjadwal" },
      { due: "31 Mei 2026", title: "Pelaporan CRS 2025", entity: "Wijaya Family Trust", amount: 0, status: "Selesai" },
    ],
    family: [
      { name: "Soedarmo Wijaya", generation: 1, relation: "Founder · Ketua Emeritus", year: 1944 },
      { name: "Bambang Wijaya", generation: 2, relation: "Ketua Family Council", year: 1968 },
      { name: "Dewi Wijaya-Tan", generation: 2, relation: "Dewan · Hospitality", year: 1971 },
      { name: "Hartono Wijaya", generation: 2, relation: "CEO PT ABC", year: 1974 },
      { name: "Arya Wijaya", generation: 3, relation: "CIO · Kandidat CEO", year: 1992 },
      { name: "Maya Wijaya", generation: 3, relation: "Head of Ventures", year: 1997 },
      { name: "Kevin Tan", generation: 3, relation: "CFO Office", year: 1995 },
    ],
    entities: [
      { name: "Wijaya Family Trust", type: "Discretionary Trust", parent: "—", ownership: "Puncak struktur" },
      { name: "PT Wijaya Investama", type: "Holding Indonesia", parent: "Wijaya Family Trust", ownership: "100%" },
      { name: "Wijaya Capital Pte Ltd", type: "Holding Singapura", parent: "Wijaya Family Trust", ownership: "100%" },
      { name: "PT ABC Manufaktur", type: "Operasional", parent: "PT Wijaya Investama", ownership: "68%" },
      { name: "PT Nusantara Retailindo", type: "Operasional", parent: "PT Wijaya Investama", ownership: "74%" },
    ],
    proposals: [
      { id: "p1", title: "Akuisisi Hotel Ubud Highlands", amount: 450, return: "IRR 17,0%", risk: "Menengah", yes: 7, no: 1, required: 7, status: "Disetujui", memo: "128 kunci · LTV 45% · sinergi operator hospitality." },
      { id: "p2", title: "Komitmen Alpha SEA Ventures Fund IV", amount: 230, return: "Target 22%", risk: "Tinggi", yes: 3, no: 0, required: 7, status: "Voting", memo: "Re-up GP kuartil-1 · deployment 4 tahun." },
      { id: "p3", title: "JV Energi Surya Atap 40 MWp", amount: 180, return: "IRR 14,5%", risk: "Menengah", yes: 0, no: 0, required: 7, status: "Due Diligence", memo: "PPA 15 tahun dengan tiga kawasan industri." },
    ],
    meetings: [
      { date: "24 Jul 2026 · 14:00", title: "Rapat Dewan Keluarga Q3", location: "Menara Wijaya Lt. 45 · hybrid", status: "Terjadwal" },
      { date: "17 Apr 2026", title: "Rapat Dewan Q2", location: "Jakarta", status: "Selesai" },
    ],
    decisions: [
      { number: "2026-06", title: "Divestasi Land Bank Karawang", signatures: "10/10", status: "Berlaku" },
      { number: "2026-07", title: "Penunjukan auditor eksternal FY2026", signatures: "7/10", status: "Menunggu" },
    ],
    constitution: [
      { title: "Misi Keluarga", body: "Menumbuhkan kesejahteraan lintas generasi yang produktif, beretika, dan berdampak bagi Indonesia — dengan kekayaan sebagai amanah, bukan tujuan." },
      { title: "Nilai-Nilai", body: "Integritas di atas peluang. Kerja nyata. Kesatuan keluarga. Keputusan diuji terhadap horizon 30 tahun." },
      { title: "Kebijakan Dividen", body: "40% distribusi anggota, 30% reinvestasi, 20% cadangan likuiditas, dan 10% filantropi." },
      { title: "Kebijakan Suksesi", body: "Suksesi berbasis kesiapan, bukan urutan lahir. Kandidat dinilai komite independen dan membutuhkan readiness score minimal 80%." },
    ],
    succession: [
      { position: "CEO Grup", current: "Bambang Wijaya", candidate: "Arya Wijaya", readiness: 72, target: "2030" },
      { position: "Ketua Family Council", current: "Bambang Wijaya", candidate: "Dewi Wijaya-Tan", readiness: 84, target: "2029" },
      { position: "Protector Trust", current: "Soedarmo Wijaya", candidate: "Komite Protector", readiness: 65, target: "2030" },
    ],
    estate: [
      { instrument: "Wasiat + Letter of Wishes", person: "Bambang Wijaya", updated: "03 Nov 2025", status: "Ditandatangani" },
      { instrument: "Wasiat", person: "Dewi Wijaya-Tan", updated: "22 Jan 2026", status: "Review" },
      { instrument: "Wasiat", person: "Hartono Wijaya", updated: "—", status: "Draft" },
    ],
    grants: [
      { program: "Beasiswa STEM Wijaya", amount: 12, status: "Disalurkan", note: "500 mahasiswa per angkatan" },
      { program: "Sayap Anak — RS Jantung", amount: 15, status: "Berjalan", note: "Tahap pembangunan 2/3" },
      { program: "Inkubator UMKM Jawa Barat", amount: 6, status: "Review", note: "480 usaha" },
    ],
    documents: [
      { name: "SHA_Retailindo_Amend3.pdf", category: "Legal", owner: "PT Nusantara Retailindo", date: "08 Jul 2026", location: "Vault eksternal" },
      { name: "Appraisal_MenaraWijaya_2026.pdf", category: "Properti", owner: "PT Wijaya Investama", date: "05 Jul 2026", location: "Vault eksternal" },
      { name: "IC-Memo_UbudHighlands_v4.pdf", category: "Investasi", owner: "Komite Investasi", date: "02 Jul 2026", location: "Vault eksternal" },
    ],
    courses: [
      { title: "Dasar Keuangan Keluarga", audience: "Wajib · Gen-3+", progress: 100 },
      { title: "Investasi: Publik & Privat", audience: "Wajib · Gen-3+", progress: 80 },
      { title: "Tata Kelola & Konstitusi", audience: "Wajib", progress: 65 },
      { title: "Kepemimpinan & Suksesi", audience: "Lanjutan", progress: 30 },
    ],
    posts: [
      { author: "Family Council", date: "Hari ini", text: "Distribusi dividen Q3 dijadwalkan 1 Agustus. Rincian tersedia di Banking." },
      { author: "Legal", date: "Kemarin", text: "Perpanjangan HGB Villa Uluwatu jatuh tempo 30 September 2026." },
    ],
    policies: [
      { name: "Jiwa — Founder", insurer: "Prudential", cover: 250, premium: 1.8, renewal: "Mar 2027", status: "Aktif" },
      { name: "Properti All-Risk", insurer: "Zurich", cover: 1850, premium: 2.1, renewal: "Nov 2026", status: "Aktif" },
      { name: "Kesehatan Keluarga", insurer: "Allianz", cover: 0, premium: 1.2, renewal: "15 Agu 2026", status: "Perhatian" },
      { name: "Cyber & Crime", insurer: "Beazley", cover: 75, premium: 0.5, renewal: "Okt 2026", status: "Aktif" },
    ],
    risks: [
      { risk: "Konsentrasi properti Indonesia", probability: "Tinggi", impact: "Tinggi", mitigation: "Rebalancing bertahap melalui IC." },
      { risk: "Refinancing 2027", probability: "Sedang", impact: "Tinggi", mitigation: "Dua term sheet telah diterima." },
      { risk: "Insiden siber", probability: "Rendah", impact: "Tinggi", mitigation: "Proxy server-side, MFA hosting, dan backup rutin." },
    ],
  };

  const EMPTY_DATA = {
    mode: "live",
    profile: { family: "Family Office Anda", currencyRate: 16450 },
    ytd: 0,
    benchmark: 0,
    perf: [],
    benchmarkPerf: [],
    assets: [],
    banks: [],
    liabilities: [],
    commitments: [],
    transactions: [],
    events: [],
    taxes: [],
    family: [],
    entities: [],
    proposals: [],
    meetings: [],
    decisions: [],
    constitution: [],
    succession: [],
    estate: [],
    grants: [],
    documents: [],
    courses: [],
    posts: [],
    policies: [],
    risks: [],
  };

  const state = {
    section: "dash",
    role: "council",
    currency: "IDR",
    assetFilter: "Semua",
    assetQuery: "",
    aiMessages: [
      {
        role: "assistant",
        content: "Selamat datang. Saya dapat merangkum alokasi, likuiditas, kewajiban, dan agenda dari data yang tampil di LegacyOS.",
      },
    ],
    scanResult: null,
  };

  let data = load();
  let modalSubmit = null;

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return mergeData(parsed);
      }
    } catch (error) {
      console.warn("LegacyOS storage unavailable", error);
    }
    return clone(DEFAULT_DATA);
  }

  function mergeData(candidate) {
    const base = candidate?.mode === "live" ? clone(EMPTY_DATA) : clone(DEFAULT_DATA);
    if (!candidate || typeof candidate !== "object") return base;
    for (const [key, value] of Object.entries(candidate)) {
      if (Array.isArray(base[key]) && Array.isArray(value)) base[key] = value;
      else if (key === "profile" && value && typeof value === "object") base.profile = { ...base.profile, ...value };
      else if (key in base && typeof value !== "undefined") base[key] = value;
    }
    return base;
  }

  function save(message) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (message) toast(message);
    } catch (error) {
      toast("Perubahan aktif selama sesi, tetapi browser menolak penyimpanan lokal.", "warning");
    }
  }

  function role() {
    return ROLES[state.role];
  }

  function allowed(id) {
    return role().allow === "*" || role().allow.includes(id);
  }

  function canEdit() {
    return Boolean(role().edit);
  }

  function cash() {
    return data.banks.reduce((total, bank) => total + Number(bank.balance || 0), 0);
  }

  function debt() {
    return data.liabilities.reduce((total, liability) => total + Number(liability.amount || 0), 0);
  }

  function assetValue() {
    return data.assets.reduce((total, asset) => total + Number(asset.value || 0), 0);
  }

  function grossAssets() {
    return assetValue() + cash();
  }

  function netWorth() {
    return grossAssets() - debt();
  }

  function unfunded() {
    return data.commitments.reduce(
      (total, commitment) => total + Math.max(Number(commitment.committed || 0) - Number(commitment.drawn || 0), 0),
      0,
    );
  }

  function allocation() {
    const groups = new Map([
      ["Private Equity", { value: 0, color: "#c2a35c" }],
      ["Real Estat", { value: 0, color: "#7fa6e8" }],
      ["Likuiditas", { value: cash(), color: "#5fb98f" }],
      ["Pasar Publik", { value: 0, color: "#9a86c8" }],
      ["Alternatif", { value: 0, color: "#d97070" }],
    ]);
    for (const asset of data.assets) {
      let key = "Alternatif";
      if (/real|properti/i.test(asset.category)) key = "Real Estat";
      else if (/perusahaan|privat|private/i.test(asset.category)) key = "Private Equity";
      else if (/publik|saham|obligasi|sukuk/i.test(asset.category)) key = "Pasar Publik";
      groups.get(key).value += Number(asset.value || 0);
    }
    const total = [...groups.values()].reduce((sum, item) => sum + item.value, 0);
    return [...groups.entries()]
      .map(([key, item]) => ({ key, ...item, percent: total ? (item.value / total) * 100 : 0 }))
      .filter((item) => item.value > 0 || item.key === "Likuiditas");
  }

  function fmt(value, decimals) {
    const amount = Number(value || 0);
    if (state.currency === "USD") {
      const millions = (amount * 1e9) / Number(data.profile.currencyRate || 16450) / 1e6;
      if (Math.abs(millions) >= 1000) {
        return `${amount < 0 ? "−" : ""}$${Math.abs(millions / 1000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} miliar`;
      }
      return `${amount < 0 ? "−" : ""}$${Math.abs(millions).toLocaleString("id-ID", { maximumFractionDigits: 1 })} juta`;
    }
    const absolute = Math.abs(amount);
    const sign = amount < 0 ? "−" : "";
    if (absolute >= 1000) {
      const digits = decimals ?? 2;
      return `${sign}Rp ${(absolute / 1000).toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits })} T`;
    }
    if (absolute >= 1) {
      return `${sign}Rp ${absolute.toLocaleString("id-ID", { maximumFractionDigits: decimals ?? (absolute < 10 ? 1 : 0) })} M`;
    }
    return `${sign}Rp ${(absolute * 1000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} jt`;
  }

  function pct(value, digits = 1) {
    return `${Number(value || 0).toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
  }

  function statusClass(status = "") {
    if (/aman|aktif|selesai|berlaku|disetujui|ditandatangani|disalurkan/i.test(status)) return "success";
    if (/tinggi|ditolak|gagal/i.test(status)) return "danger";
    if (/review|menunggu|perhatian|draft|menengah/i.test(status)) return "warning";
    return "info";
  }

  function statusChip(status) {
    return `<span class="chip ${statusClass(status)}">${escapeHtml(status || "—")}</span>`;
  }

  function pageHeader(crumb, title, subtitle = "") {
    return `
      <p class="crumb">${escapeHtml(crumb)}</p>
      <h1 class="page-title">${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="page-subtitle">${subtitle}</p>` : ""}
      <div class="rule"></div>`;
  }

  function panelHead(title, action = "") {
    return `<div class="panel-head"><h3>${escapeHtml(title)}</h3>${action}</div>`;
  }

  function barRow(label, value, colorClass = "") {
    return `<div class="bar-row"><span class="muted">${escapeHtml(label)}</span><div class="bar ${colorClass}"><i style="width:${Math.max(0, Math.min(Number(value), 100))}%"></i></div><output>${pct(value, 0)}</output></div>`;
  }

  function lineChart(primary, comparison) {
    if (!primary.length) return `<div class="empty-state">Belum ada histori kinerja.</div>`;
    const all = primary.concat(comparison || primary);
    const min = Math.min(...all) * 0.98;
    const max = Math.max(...all) * 1.02;
    const width = 660;
    const height = 205;
    const pad = 24;
    const span = max - min || 1;
    const points = (values) =>
      values
        .map((value, index) => {
          const x = pad + ((width - pad * 2) * index) / Math.max(values.length - 1, 1);
          const y = 10 + (height - 38) - ((value - min) / span) * (height - 38);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    const grid = [0, 0.25, 0.5, 0.75, 1]
      .map((ratio) => {
        const y = 10 + (height - 38) * ratio;
        return `<line x1="${pad}" x2="${width - pad}" y1="${y}" y2="${y}" stroke="#232c3f" stroke-dasharray="2 4"></line>`;
      })
      .join("");
    return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafik kinerja portofolio">
      ${grid}
      ${comparison?.length ? `<polyline points="${points(comparison)}" fill="none" stroke="#5a6375" stroke-width="1.5" stroke-dasharray="5 5"></polyline>` : ""}
      <polyline points="${points(primary)}" fill="none" stroke="#c2a35c" stroke-width="2.5" stroke-linejoin="round"></polyline>
      <text x="${pad}" y="${height - 5}" fill="#7c8598" font-size="10">18 bulan lalu</text>
      <text x="${width - pad}" y="${height - 5}" fill="#7c8598" font-size="10" text-anchor="end">Hari ini</text>
    </svg>`;
  }

  function donut(items) {
    if (!items.some((item) => item.value > 0)) return `<div class="empty-state">Belum ada alokasi.</div>`;
    let cursor = 0;
    const stops = items.map((item) => {
      const start = cursor;
      cursor += item.percent;
      return `${item.color} ${start.toFixed(1)}% ${cursor.toFixed(1)}%`;
    });
    return `<div class="donut-layout">
      <div class="donut" style="background:conic-gradient(${stops.join(",")})">
        <div class="donut-center"><strong>${fmt(netWorth())}</strong><span>Net worth</span></div>
      </div>
      <div class="legend">${items.map((item) => `<div class="legend-row"><i class="swatch" style="background:${item.color}"></i><span>${escapeHtml(item.key)} · ${pct(item.percent, 0)}</span><span class="mono">${fmt(item.value)}</span></div>`).join("")}</div>
    </div>`;
  }

  function toast(message, type = "gold") {
    const node = document.createElement("div");
    node.className = `toast ${type}`;
    node.textContent = message;
    $("#toasts").append(node);
    window.setTimeout(() => node.remove(), 3400);
  }

  function closeModal() {
    $("#modal-root").hidden = true;
    $("#modal").innerHTML = "";
    modalSubmit = null;
  }

  function openModal(title, body, actions = "") {
    $("#modal").innerHTML = `
      <header class="modal-header">
        <h2 id="modal-title">${escapeHtml(title)}</h2>
        <button class="icon-button" type="button" data-action="modal-close" aria-label="Tutup">×</button>
      </header>
      <div class="rule"></div>
      ${body}
      ${actions ? `<div class="modal-actions">${actions}</div>` : ""}`;
    $("#modal-root").hidden = false;
    $(".modal [data-autofocus]")?.focus();
  }

  function openForm(title, fields, onSubmit, destructiveAction = "") {
    const body = `<form id="modal-form"><div class="form-grid">${fields.map((field) => {
      const id = `field-${escapeHtml(field.name)}`;
      const value = field.value ?? "";
      const full = field.full ? " full" : "";
      if (field.type === "select") {
        return `<label class="field${full}" for="${id}"><span>${escapeHtml(field.label)}</span><select id="${id}" name="${escapeHtml(field.name)}">${field.options.map((option) => `<option value="${escapeHtml(option)}" ${String(option) === String(value) ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></label>`;
      }
      if (field.type === "textarea") {
        return `<label class="field${full}" for="${id}"><span>${escapeHtml(field.label)}</span><textarea id="${id}" name="${escapeHtml(field.name)}" rows="3">${escapeHtml(value)}</textarea></label>`;
      }
      return `<label class="field${full}" for="${id}"><span>${escapeHtml(field.label)}</span><input id="${id}" name="${escapeHtml(field.name)}" type="${field.type || "text"}" step="${field.type === "number" ? "any" : ""}" value="${escapeHtml(value)}" ${field.required ? "required" : ""} ${field.autofocus ? "data-autofocus" : ""}></label>`;
    }).join("")}</div></form>`;
    const actions = `${destructiveAction}<button class="btn" type="button" data-action="modal-close">Batal</button><button class="btn gold" type="submit" form="modal-form">Simpan</button>`;
    openModal(title, body, actions);
    modalSubmit = onSubmit;
    $("#modal-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      onSubmit(values);
    });
  }

  function renderNav() {
    let html = "";
    let pendingGroup = "";
    for (const item of MODULES) {
      if (item.group) {
        pendingGroup = `<div class="nav-group">${escapeHtml(item.group)}</div>`;
        continue;
      }
      if (!allowed(item.id)) continue;
      html += pendingGroup;
      pendingGroup = "";
      html += `<button class="nav-item ${state.section === item.id ? "active" : ""}" type="button" data-module="${item.id}"><span class="nav-icon">${ICONS[item.id] || "·"}</span><span>${escapeHtml(item.label)}</span></button>`;
    }
    $("#nav").innerHTML = html;
  }

  function go(section, focus = true) {
    if (!allowed(section)) {
      toast("Peran aktif tidak memiliki akses ke modul ini.", "warning");
      return;
    }
    state.section = section;
    renderNav();
    const renderer = RENDERERS[section] || renderUnavailable;
    $("#view").innerHTML = renderer();
    $("#rail").classList.remove("open");
    if (focus) $("#view").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
    afterRender(section);
  }

  function renderUnavailable() {
    return pageHeader("LegacyOS", "Modul", "") + `<div class="empty-state">Modul belum tersedia.</div>`;
  }

  function renderDashboard() {
    const alloc = allocation();
    const nw = netWorth();
    const liquidity = cash();
    const liquidityPct = nw > 0 ? (liquidity / nw) * 100 : 0;
    const netCash = liquidity - debt();
    const alerts = [];
    if (!data.assets.length) alerts.push({ kind: "info", icon: "◇", title: "Tambahkan aset pertama", detail: "Registri masih kosong", module: "assets" });
    if (!data.banks.length) alerts.push({ kind: "warning", icon: "▤", title: "Tambahkan rekening", detail: "Likuiditas belum dapat dihitung", module: "banking" });
    if (unfunded() > liquidity * 0.4 && liquidity > 0) alerts.push({ kind: "danger", icon: "⚖", title: "Komitmen melebihi 40% likuiditas", detail: `${fmt(unfunded())} belum ditarik`, module: "liab" });
    if (!alerts.length) {
      alerts.push(
        { kind: "warning", icon: "§", title: "Tenggat pajak terdekat", detail: data.taxes.find((item) => item.status !== "Selesai")?.due || "Belum ada", module: "tax" },
        { kind: "info", icon: "↗", title: "Proposal aktif", detail: `${data.proposals.filter((item) => item.status === "Voting").length} menunggu voting`, module: "invest" },
        { kind: "success", icon: "✓", title: "Data siap", detail: `${data.assets.length} aset · ${data.banks.length} rekening`, module: "data" },
      );
    }
    return pageHeader(
      `Ikhtisar · ${new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
      `Selamat datang, ${data.profile.family}`,
      `${data.mode === "demo" ? "Data contoh fiktif" : "Data Anda"} · tersimpan pada browser ini`,
    ) + `
      <div class="alert-strip">${alerts.map((alert) => `<button class="alert ${alert.kind}" type="button" data-module="${alert.module}"><strong>${alert.icon}</strong><span><b>${escapeHtml(alert.title)}</b><span>${escapeHtml(alert.detail)}</span></span></button>`).join("")}</div>
      <div class="grid cols-4">
        <article class="panel"><div class="kpi-label">Net Worth Bersih</div><div class="kpi-value">${fmt(nw)}</div><div class="kpi-sub">Aset bruto ${fmt(grossAssets())} − utang ${fmt(debt())}</div></article>
        <article class="panel"><div class="kpi-label">Kinerja YTD</div><div class="kpi-value ${data.ytd >= 0 ? "up" : "down"}">${data.ytd >= 0 ? "+" : ""}${pct(data.ytd)}</div><div class="kpi-sub">Benchmark ${data.benchmark >= 0 ? "+" : ""}${pct(data.benchmark)}</div></article>
        <article class="panel"><div class="kpi-label">Likuiditas</div><div class="kpi-value">${fmt(liquidity)}</div><div class="kpi-sub">${pct(liquidityPct, 0)} dari NW · target minimum 15%</div></article>
        <article class="panel"><div class="kpi-label">Posisi Net Cash</div><div class="kpi-value ${netCash >= 0 ? "up" : "down"}">${fmt(netCash)}</div><div class="kpi-sub">${netCash >= 0 ? "Kas melebihi utang" : "Utang melebihi kas"}</div></article>
      </div>
      <div class="grid cols-2-1" style="margin-top:16px">
        <article class="panel">${panelHead("Kinerja 18 Bulan", `<span class="chip">net of fees</span>`)}${lineChart(data.perf, data.benchmarkPerf)}</article>
        <article class="panel">${panelHead("Alokasi Aset", `<button class="link-button" data-module="analytics">Analitik →</button>`)}${donut(alloc)}</article>
      </div>
      <div class="grid cols-2-1" style="margin-top:16px">
        <article class="panel">${panelHead("Komposisi Portofolio")}
          ${alloc.map((item) => barRow(item.key, item.percent, item.key === "Likuiditas" ? "green" : item.key === "Real Estat" ? "blue" : "")).join("")}
          <p class="note">Komitmen modal belum ditarik: <strong>${fmt(unfunded())}</strong> (${cash() ? pct((unfunded() / cash()) * 100, 0) : "—"} dari kas).</p>
        </article>
        <article class="panel">${panelHead("90 Hari ke Depan")}
          <div class="timeline">${data.events.slice(0, 6).map((event) => `<button class="timeline-item link-button" type="button" data-module="${escapeHtml(event.module)}" style="text-align:left"><time>${escapeHtml(event.date)}</time><b>${escapeHtml(event.title)}</b><p>${escapeHtml(event.detail)}</p></button>`).join("") || `<div class="empty-state">Belum ada agenda.</div>`}</div>
        </article>
      </div>`;
  }

  function renderAssets() {
    const categories = ["Semua", ...new Set(data.assets.map((asset) => asset.category))];
    const query = state.assetQuery.toLowerCase();
    const assets = data.assets.filter((asset) =>
      (state.assetFilter === "Semua" || asset.category === state.assetFilter)
      && (!query || `${asset.name} ${asset.location} ${asset.owner}`.toLowerCase().includes(query)),
    );
    return pageHeader("Kekayaan", "Asset Registry", `${data.assets.length} aset tercatat · nilai tampilan ${fmt(assets.reduce((sum, asset) => sum + Number(asset.value), 0))}`) + `
      <div class="toolbar">
        <div class="chip-row">${categories.map((category) => `<button class="filter-button ${state.assetFilter === category ? "active" : ""}" type="button" data-action="asset-filter" data-value="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("")}</div>
        ${canEdit() ? `<button class="btn gold small" type="button" data-action="asset-add">＋ Tambah aset</button>` : ""}
      </div>
      ${assets.length ? `<div class="grid cols-3">${assets.map((asset) => `<button class="asset-card" type="button" data-action="asset-open" data-id="${escapeHtml(asset.id)}">
        <header><div><div class="category">${escapeHtml(asset.category)}</div><h3>${escapeHtml(asset.name)}</h3></div>${statusChip(asset.risk)}</header>
        <div class="value">${fmt(asset.value)}</div>
        <p>${escapeHtml(asset.location)}</p><small>${escapeHtml(asset.note || asset.owner)}</small>
      </button>`).join("")}</div>` : `<div class="empty-state">Tidak ada aset yang cocok. ${canEdit() ? "Gunakan “Tambah aset” untuk memulai." : ""}</div>`}`;
  }

  function renderBanking() {
    const liquidity = cash();
    const nw = netWorth();
    return pageHeader("Kekayaan", "Banking & Treasury", "Rekening dan buku besar pada perangkat ini; integrasi kustodian memerlukan backend terautentikasi.") + `
      <div class="grid cols-3">
        <article class="panel"><div class="kpi-label">Posisi Kas</div><div class="kpi-value">${fmt(liquidity)}</div><div class="kpi-sub">${nw ? pct((liquidity / nw) * 100) : "—"} dari NW</div></article>
        <article class="panel"><div class="kpi-label">Rekening</div><div class="kpi-value">${data.banks.length}</div><div class="kpi-sub">Saldo ekuivalen Rupiah</div></article>
        <article class="panel"><div class="kpi-label">Transaksi Tercatat</div><div class="kpi-value">${data.transactions.length}</div><div class="kpi-sub">Entri manual dan hasil pindai</div></article>
      </div>
      <article class="panel" style="margin-top:16px">
        ${panelHead("Rekening", canEdit() ? `<button class="btn small" type="button" data-action="bank-add">＋ Rekening</button>` : "")}
        <div class="table-scroll"><table><thead><tr><th>Bank</th><th>Fungsi</th><th>Mata uang</th><th class="number">Saldo eq. IDR</th><th></th></tr></thead><tbody>
          ${data.banks.map((bank) => `<tr><td><span class="name">${escapeHtml(bank.bank)}</span><span class="sub mono">${escapeHtml(bank.account)}</span></td><td class="muted">${escapeHtml(bank.purpose)}</td><td>${statusChip(bank.currency)}</td><td class="number">${fmt(bank.balance)}</td><td>${canEdit() ? `<button class="btn small" type="button" data-action="bank-edit" data-id="${escapeHtml(bank.id)}">Edit</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">Belum ada rekening.</td></tr>`}
        </tbody></table></div>
      </article>
      <article class="panel" style="margin-top:16px">
        ${panelHead("Transaksi Terbaru", canEdit() ? `<button class="btn small" type="button" data-action="transaction-add">＋ Entri</button>` : "")}
        <div class="table-scroll"><table><thead><tr><th>Tanggal</th><th>Jenis</th><th>Keterangan</th><th>Rekening</th><th class="number">Jumlah</th></tr></thead><tbody>
          ${data.transactions.slice(0, 12).map((transaction) => `<tr><td class="mono">${escapeHtml(transaction.date)}</td><td>${statusChip(transaction.type)}</td><td class="name">${escapeHtml(transaction.description)}</td><td class="muted">${escapeHtml(transaction.account)}</td><td class="number ${transaction.direction > 0 ? "up" : "down"}">${transaction.direction > 0 ? "+" : "−"}${fmt(transaction.amount)}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">Belum ada transaksi.</td></tr>`}
        </tbody></table></div>
      </article>`;
  }

  function renderAnalytics() {
    const alloc = allocation();
    return pageHeader("Kekayaan", "Portfolio Analytics", "Kinerja, konsentrasi, dan simulasi skenario terhadap posisi konsolidasi.") + `
      <div class="grid cols-4">
        <article class="panel"><div class="kpi-label">Kinerja YTD</div><div class="kpi-value up">+${pct(data.ytd)}</div><div class="kpi-sub">vs benchmark +${pct(data.benchmark)}</div></article>
        <article class="panel"><div class="kpi-label">Likuiditas / NW</div><div class="kpi-value">${netWorth() ? pct((cash() / netWorth()) * 100) : "—"}</div><div class="kpi-sub">target minimum 15%</div></article>
        <article class="panel"><div class="kpi-label">Utang / Aset Bruto</div><div class="kpi-value">${grossAssets() ? pct((debt() / grossAssets()) * 100) : "—"}</div><div class="kpi-sub">seluruh fasilitas</div></article>
        <article class="panel"><div class="kpi-label">Unfunded / Kas</div><div class="kpi-value">${cash() ? pct((unfunded() / cash()) * 100) : "—"}</div><div class="kpi-sub">plafon kebijakan 40%</div></article>
      </div>
      <div class="grid cols-2-1" style="margin-top:16px">
        <article class="panel">${panelHead("Kinerja")} ${lineChart(data.perf, data.benchmarkPerf)}</article>
        <article class="panel">${panelHead("Alokasi")}${alloc.map((item) => barRow(item.key, item.percent)).join("")}</article>
      </div>
      <article class="panel" style="margin-top:16px">
        ${panelHead("Stress Test — Simulasi Interaktif", `<span class="chip info">lokal</span>`)}
        <div class="grid cols-2">
          <div>
            <label class="slider-row"><span>Real Estat</span><input id="stress-property" type="range" min="-50" max="20" value="-20"><output id="stress-property-value">−20%</output></label>
            <label class="slider-row"><span>Private Equity</span><input id="stress-private" type="range" min="-50" max="20" value="-10"><output id="stress-private-value">−10%</output></label>
            <label class="slider-row"><span>Pasar Publik</span><input id="stress-public" type="range" min="-50" max="30" value="-15"><output id="stress-public-value">−15%</output></label>
            <label class="slider-row"><span>Likuiditas</span><input id="stress-cash" type="range" min="-20" max="10" value="0"><output id="stress-cash-value">0%</output></label>
            <p class="note">Simulasi indikatif; bukan valuasi atau nasihat investasi.</p>
          </div>
          <div id="stress-result" class="stress-result"></div>
        </div>
      </article>`;
  }

  function renderTax() {
    const pending = data.taxes.filter((item) => item.status !== "Selesai");
    return pageHeader("Kekayaan", "Tax Center", "Kalender pajak dan kepatuhan; validasi akhir tetap dilakukan penasihat berlisensi.") + `
      <div class="grid cols-3">
        <article class="panel"><div class="kpi-label">Kewajiban Terbuka</div><div class="kpi-value">${pending.length}</div><div class="kpi-sub">${pending[0]?.due || "Tidak ada"}</div></article>
        <article class="panel"><div class="kpi-label">Estimasi Terbuka</div><div class="kpi-value">${fmt(pending.reduce((sum, item) => sum + Number(item.amount || 0), 0))}</div><div class="kpi-sub">belum termasuk bunga/denda</div></article>
        <article class="panel"><div class="kpi-label">Selesai</div><div class="kpi-value up">${data.taxes.filter((item) => item.status === "Selesai").length}</div><div class="kpi-sub">tercatat pada perangkat ini</div></article>
      </div>
      <article class="panel" style="margin-top:16px">${panelHead("Kalender & Estimasi")}
        <div class="table-scroll"><table><thead><tr><th>Tenggat</th><th>Kewajiban</th><th>Entitas</th><th class="number">Estimasi</th><th>Status</th></tr></thead><tbody>
          ${data.taxes.map((item) => `<tr><td class="mono">${escapeHtml(item.due)}</td><td class="name">${escapeHtml(item.title)}</td><td class="muted">${escapeHtml(item.entity)}</td><td class="number">${item.amount ? fmt(item.amount) : "—"}</td><td>${statusChip(item.status)}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">Belum ada kalender pajak.</td></tr>`}
        </tbody></table></div>
      </article>`;
  }

  function renderLiabilities() {
    const due2027 = data.liabilities.filter((item) => String(item.due) === "2027").reduce((sum, item) => sum + Number(item.amount), 0);
    return pageHeader("Kekayaan", "Kewajiban & Leverage", "Fasilitas kredit, jatuh tempo, kovenan, dan komitmen modal.") + `
      <div class="grid cols-4">
        <article class="panel"><div class="kpi-label">Utang Bruto</div><div class="kpi-value">${fmt(debt())}</div><div class="kpi-sub">${grossAssets() ? pct((debt() / grossAssets()) * 100) : "—"} aset bruto</div></article>
        <article class="panel"><div class="kpi-label">Net Cash</div><div class="kpi-value ${cash() - debt() >= 0 ? "up" : "down"}">${fmt(cash() - debt())}</div><div class="kpi-sub">kas dikurangi utang</div></article>
        <article class="panel"><div class="kpi-label">Jatuh Tempo 2027</div><div class="kpi-value warn">${fmt(due2027)}</div><div class="kpi-sub">perlu rencana refinancing</div></article>
        <article class="panel"><div class="kpi-label">Komitmen Belum Ditarik</div><div class="kpi-value">${fmt(unfunded())}</div><div class="kpi-sub">${cash() ? pct((unfunded() / cash()) * 100) : "—"} dari likuiditas</div></article>
      </div>
      <div class="grid cols-2-1" style="margin-top:16px">
        <article class="panel">${panelHead("Fasilitas Kredit", canEdit() ? `<button class="btn small" type="button" data-action="liability-add">＋ Fasilitas</button>` : "")}
          <div class="table-scroll"><table><thead><tr><th>Fasilitas</th><th>Kreditur</th><th class="number">Pokok</th><th>Bunga</th><th>Tempo</th><th>Status</th></tr></thead><tbody>
            ${data.liabilities.map((item) => `<tr><td class="name">${escapeHtml(item.facility)}</td><td class="muted">${escapeHtml(item.lender)}</td><td class="number">${fmt(item.amount)}</td><td class="mono">${escapeHtml(item.rate)}</td><td class="mono">${escapeHtml(item.due)}</td><td>${statusChip(item.status)}</td></tr>`).join("") || `<tr><td colspan="6" class="muted">Tidak ada kewajiban.</td></tr>`}
          </tbody></table></div>
        </article>
        <article class="panel">${panelHead("Komitmen Modal")}
          ${data.commitments.map((item) => {
            const drawn = item.committed ? (item.drawn / item.committed) * 100 : 0;
            return `<div style="margin-bottom:13px"><div class="toolbar" style="margin-bottom:4px"><span class="name">${escapeHtml(item.fund)}</span><span class="mono muted">${fmt(item.drawn)} / ${fmt(item.committed)}</span></div><div class="bar"><i style="width:${drawn}%"></i></div><p class="note">Sisa ${fmt(item.committed - item.drawn)} · berikutnya ${escapeHtml(item.next)}</p></div>`;
          }).join("") || `<div class="empty-state">Belum ada komitmen.</div>`}
        </article>
      </div>`;
  }

  function renderFamily() {
    const generations = [...new Set(data.family.map((person) => person.generation))].sort();
    return pageHeader("Tata Kelola", "Family Tree", "Anggota dikelompokkan per generasi; data ini hanyalah registri lokal.") + `
      ${generations.map((generation) => `<section style="margin-bottom:18px"><p class="nav-group" style="padding-left:0">Generasi ${escapeHtml(generation)}</p><div class="person-grid">${data.family.filter((person) => person.generation === generation).map((person) => `<article class="person"><div class="person-avatar">${escapeHtml(person.name.split(/\s+/).map((word) => word[0]).slice(0, 2).join(""))}</div><b>${escapeHtml(person.name)}</b><span>${escapeHtml(person.relation)}</span><span>Lahir ${escapeHtml(person.year)}</span></article>`).join("")}</div></section>`).join("") || `<div class="empty-state">Belum ada anggota keluarga.</div>`}`;
  }

  function renderStructure() {
    return pageHeader("Tata Kelola", "Ownership Structure", "Registri induk, entitas, SPV, trust, dan perusahaan operasional.") + `
      <div class="entity-grid">${data.entities.map((entity) => `<article class="entity"><span class="eyebrow">${escapeHtml(entity.type)}</span><b>${escapeHtml(entity.name)}</b><span>Induk: ${escapeHtml(entity.parent)}</span><span>Kepemilikan: ${escapeHtml(entity.ownership)}</span></article>`).join("") || `<div class="empty-state">Belum ada entitas.</div>`}</div>`;
  }

  function renderInvestments() {
    return pageHeader("Tata Kelola", "Investment Committee", `Voting perangkat ini · hak suara peran: ${role().vote ? "aktif" : "tidak aktif"}`) + `
      ${data.proposals.map((proposal) => `<article class="panel proposal">
        ${panelHead(proposal.title, statusChip(proposal.status))}
        <div class="proposal-facts"><div><b>${fmt(proposal.amount)}</b><span>Komitmen</span></div><div><b>${escapeHtml(proposal.return)}</b><span>Target</span></div><div><b>${escapeHtml(proposal.risk)}</b><span>Risiko</span></div><div><b>${proposal.yes}/${proposal.required}</b><span>Setuju / dibutuhkan</span></div></div>
        <p class="muted">${escapeHtml(proposal.memo)}</p>
        <div class="bar green" style="margin:12px 0"><i style="width:${Math.min((proposal.yes / proposal.required) * 100, 100)}%"></i></div>
        ${proposal.status === "Voting" ? `<div class="chip-row"><button class="btn gold small" type="button" data-action="proposal-vote" data-id="${escapeHtml(proposal.id)}" data-vote="yes" ${role().vote ? "" : "disabled"}>Setuju</button><button class="btn danger small" type="button" data-action="proposal-vote" data-id="${escapeHtml(proposal.id)}" data-vote="no" ${role().vote ? "" : "disabled"}>Tolak</button></div>` : ""}
      </article>`).join("") || `<div class="empty-state">Belum ada proposal.</div>`}
      <p class="note">Voting ini hanya demonstrasi pada satu browser. Multi-anggota, identitas, dan e-sign memerlukan backend serta autentikasi.</p>`;
  }

  function renderBoard() {
    return pageHeader("Tata Kelola", "Board Meeting", "Agenda rapat dan resolusi keluarga.") + `
      <div class="grid cols-2">
        <article class="panel">${panelHead("Jadwal Rapat")}
          <div class="timeline">${data.meetings.map((meeting) => `<div class="timeline-item"><time>${escapeHtml(meeting.date)}</time><b>${escapeHtml(meeting.title)}</b><p>${escapeHtml(meeting.location)} · ${escapeHtml(meeting.status)}</p></div>`).join("") || `<div class="empty-state">Belum ada rapat.</div>`}</div>
        </article>
        <article class="panel">${panelHead("Keputusan & Resolusi")}
          <div class="table-scroll"><table><thead><tr><th>No.</th><th>Keputusan</th><th>Tanda tangan</th><th>Status</th></tr></thead><tbody>${data.decisions.map((decision) => `<tr><td class="mono">${escapeHtml(decision.number)}</td><td class="name">${escapeHtml(decision.title)}</td><td>${escapeHtml(decision.signatures)}</td><td>${statusChip(decision.status)}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">Belum ada keputusan.</td></tr>`}</tbody></table></div>
        </article>
      </div>`;
  }

  function renderConstitution() {
    return pageHeader("Tata Kelola", "Family Constitution", "Nilai, aturan main, dan kebijakan keluarga.") + `
      ${data.constitution.map((section, index) => `<details class="accordion" ${index === 0 ? "open" : ""}><summary>${String(index + 1).padStart(2, "0")} · ${escapeHtml(section.title)}</summary><div>${escapeHtml(section.body)}</div></details>`).join("") || `<div class="empty-state">Konstitusi masih kosong.</div>`}`;
  }

  function renderSuccession() {
    return pageHeader("Tata Kelola", "Succession Planning", "Posisi kunci, kandidat, dan kesiapan transisi.") + `
      <div class="grid cols-3">${data.succession.map((item) => `<article class="panel">
        ${panelHead(item.position, `<span class="chip gold">${escapeHtml(item.target)}</span>`)}
        <p class="muted">Saat ini: <strong class="name">${escapeHtml(item.current)}</strong></p>
        <p style="margin-top:5px">Kandidat: <strong class="name">${escapeHtml(item.candidate)}</strong></p>
        <div class="bar" style="margin-top:14px"><i style="width:${Math.min(item.readiness, 100)}%"></i></div>
        <p class="note">Readiness ${pct(item.readiness, 0)}</p>
      </article>`).join("") || `<div class="empty-state">Belum ada peta suksesi.</div>`}</div>`;
  }

  function renderEstate() {
    return pageHeader("Tata Kelola", "Estate Planning", "Status wasiat, trust, hibah, dan instrumen pewarisan.") + `
      <article class="panel">${panelHead("Instrumen Estate")}
        <div class="table-scroll"><table><thead><tr><th>Instrumen</th><th>Pihak</th><th>Diperbarui</th><th>Status</th></tr></thead><tbody>${data.estate.map((item) => `<tr><td class="name">${escapeHtml(item.instrument)}</td><td>${escapeHtml(item.person)}</td><td class="mono">${escapeHtml(item.updated)}</td><td>${statusChip(item.status)}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">Belum ada instrumen.</td></tr>`}</tbody></table></div>
        <p class="note">Simpan dokumen asli pada notaris atau penyimpanan aman. LegacyOS hanya menyimpan metadata pada browser.</p>
      </article>`;
  }

  function renderGiving() {
    const distributed = data.grants.filter((item) => item.status === "Disalurkan").reduce((sum, item) => sum + Number(item.amount), 0);
    return pageHeader("Tata Kelola", "Filantropi — Yayasan", "Pipeline program dan penyaluran dampak.") + `
      <div class="grid cols-3"><article class="panel"><div class="kpi-label">Program</div><div class="kpi-value">${data.grants.length}</div><div class="kpi-sub">seluruh status</div></article><article class="panel"><div class="kpi-label">Disalurkan</div><div class="kpi-value">${fmt(distributed)}</div><div class="kpi-sub">berdasarkan status program</div></article><article class="panel"><div class="kpi-label">Dalam Review</div><div class="kpi-value warn">${data.grants.filter((item) => item.status === "Review").length}</div><div class="kpi-sub">menunggu dewan yayasan</div></article></div>
      <article class="panel" style="margin-top:16px">${panelHead("Pipeline Hibah")}<div class="table-scroll"><table><thead><tr><th>Program</th><th class="number">Nilai</th><th>Status</th><th>Catatan</th></tr></thead><tbody>${data.grants.map((grant) => `<tr><td class="name">${escapeHtml(grant.program)}</td><td class="number">${fmt(grant.amount)}</td><td>${statusChip(grant.status)}</td><td class="muted">${escapeHtml(grant.note)}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">Belum ada program.</td></tr>`}</tbody></table></div></article>`;
  }

  function renderVault() {
    return pageHeader("Operasional", "Document Vault", "Registri metadata dokumen. Berkas asli tidak diunggah oleh versi statis ini.") + `
      <div class="folder-grid">${data.documents.map((document) => `<article class="folder"><div class="folder-icon">▧</div><b>${escapeHtml(document.name)}</b><span>${escapeHtml(document.category)} · ${escapeHtml(document.owner)}</span><span>${escapeHtml(document.date)} · ${escapeHtml(document.location)}</span></article>`).join("") || `<div class="empty-state">Registri dokumen kosong.</div>`}</div>
      <p class="note">Untuk penyimpanan berkas terenkripsi lintas perangkat, tambahkan backend, autentikasi, object storage privat, dan audit log.</p>`;
  }

  function renderEducation() {
    return pageHeader("Operasional", "Family Education", "Kurikulum internal dan kesiapan generasi penerus.") + `
      <div class="grid cols-3">${data.courses.map((course) => `<article class="panel">${panelHead(course.title)}<p class="muted">${escapeHtml(course.audience)}</p><div class="bar ${course.progress === 100 ? "green" : ""}" style="margin-top:15px"><i style="width:${course.progress}%"></i></div><p class="note">Progres ${pct(course.progress, 0)}</p></article>`).join("") || `<div class="empty-state">Belum ada program edukasi.</div>`}</div>`;
  }

  function renderCommunication() {
    return pageHeader("Operasional", "Communication", "Papan pengumuman lokal; bukan chat realtime lintas anggota.") + `
      <article class="panel">
        ${canEdit() ? `<form id="post-form" class="chat-input" style="border:0;padding:0 0 14px"><input id="post-input" placeholder="Tulis pengumuman keluarga…" required><button class="btn gold" type="submit">Kirim</button></form>` : ""}
        <div class="stack">${data.posts.map((post) => `<article class="person"><b>${escapeHtml(post.author)}</b><span>${escapeHtml(post.date)}</span><p style="margin-top:7px">${escapeHtml(post.text)}</p></article>`).join("") || `<div class="empty-state">Belum ada pengumuman.</div>`}</div>
      </article>`;
  }

  function renderInsurance() {
    const premium = data.policies.reduce((sum, policy) => sum + Number(policy.premium), 0);
    return pageHeader("Operasional", "Asuransi & Manajemen Risiko", "Registri polis dan risk register keluarga.") + `
      <div class="grid cols-3"><article class="panel"><div class="kpi-label">Premi / Tahun</div><div class="kpi-value">${fmt(premium)}</div><div class="kpi-sub">${data.policies.length} polis</div></article><article class="panel"><div class="kpi-label">Nilai Pertanggungan</div><div class="kpi-value">${fmt(data.policies.reduce((sum, policy) => sum + Number(policy.cover), 0))}</div><div class="kpi-sub">polis tercatat</div></article><article class="panel"><div class="kpi-label">Perlu Perhatian</div><div class="kpi-value warn">${data.policies.filter((policy) => policy.status === "Perhatian").length}</div><div class="kpi-sub">renewal atau review</div></article></div>
      <article class="panel" style="margin-top:16px">${panelHead("Registri Polis")}<div class="table-scroll"><table><thead><tr><th>Polis</th><th>Penanggung</th><th class="number">UP</th><th class="number">Premi</th><th>Renewal</th></tr></thead><tbody>${data.policies.map((policy) => `<tr><td class="name">${escapeHtml(policy.name)}</td><td>${escapeHtml(policy.insurer)}</td><td class="number">${policy.cover ? fmt(policy.cover) : "Rahasia"}</td><td class="number">${fmt(policy.premium)}</td><td>${statusChip(policy.renewal)}</td></tr>`).join("") || `<tr><td colspan="5" class="muted">Belum ada polis.</td></tr>`}</tbody></table></div></article>
      <article class="panel" style="margin-top:16px">${panelHead("Risk Register")}<div class="table-scroll"><table><thead><tr><th>Risiko</th><th>Probabilitas</th><th>Dampak</th><th>Mitigasi</th></tr></thead><tbody>${data.risks.map((risk) => `<tr><td class="name">${escapeHtml(risk.risk)}</td><td>${statusChip(risk.probability)}</td><td>${statusChip(risk.impact)}</td><td class="muted">${escapeHtml(risk.mitigation)}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">Belum ada risiko.</td></tr>`}</tbody></table></div></article>`;
  }

  function renderSecurity() {
    return pageHeader("Operasional", "Keamanan & Akses", "Status keamanan aktual untuk deployment statis ini.") + `
      <div class="grid cols-3">
        <article class="panel"><div class="kpi-label">Data Aplikasi</div><div class="kpi-value" style="font-size:18px">Browser localStorage</div><div class="kpi-sub">per perangkat · bukan zero-knowledge cloud</div></article>
        <article class="panel"><div class="kpi-label">Kunci AI</div><div class="kpi-value" style="font-size:18px">Vercel AI Gateway</div><div class="kpi-sub">tidak dikirim ke browser</div></article>
        <article class="panel"><div class="kpi-label">Autentikasi</div><div class="kpi-value warn" style="font-size:18px">Demo client-side</div><div class="kpi-sub">tambahkan Vercel Authentication sebelum data nyata</div></article>
      </div>
      <article class="panel" style="margin-top:16px">${panelHead("Matriks Peran")}
        <div class="table-scroll"><table><thead><tr><th>Peran</th><th>Edit</th><th>Voting</th><th>Jumlah modul</th></tr></thead><tbody>${Object.values(ROLES).map((item) => `<tr><td class="name">${escapeHtml(item.label)}</td><td>${statusChip(item.edit ? "Aktif" : "Read-only")}</td><td>${statusChip(item.vote ? "Aktif" : "Tidak")}</td><td>${item.allow === "*" ? "Semua" : item.allow.length}</td></tr>`).join("")}</tbody></table></div>
        <p class="note">Pemilih peran di UI hanya simulasi izin. Untuk produksi, tegakkan izin pada server/database, bukan hanya di browser.</p>
      </article>`;
  }

  function renderAI() {
    const quick = [
      "Ringkas posisi portofolio dan likuiditas.",
      "Apa risiko kewajiban terbesar?",
      "Jika properti turun 20%, apa dampaknya?",
      "Apa agenda terdekat?",
    ];
    return pageHeader("Intelijen", "AI Advisor", "Permintaan dikirim melalui Vercel Function + AI Gateway; kunci penyedia AI tidak pernah diekspos ke browser.") + `
      <div class="grid cols-2-1">
        <article class="panel">
          <div class="chip-row" style="margin-bottom:12px">${quick.map((question) => `<button class="filter-button" type="button" data-action="ai-quick" data-question="${escapeHtml(question)}">${escapeHtml(question)}</button>`).join("")}</div>
          <div class="chat">
            <div id="ai-log" class="chat-log">${state.aiMessages.map((message) => `<div class="message ${message.role === "user" ? "me" : "ai"}"><small>${message.role === "user" ? role().label : "AI Advisor"}</small><div class="bubble">${escapeHtml(message.content)}</div></div>`).join("")}</div>
            <form id="ai-form" class="chat-input"><input id="ai-input" placeholder="Tanyakan portofolio, risiko, atau agenda…" required><button class="btn gold" type="submit">Tanya</button></form>
          </div>
          <p class="note">Analitik informatif, bukan nasihat investasi, pajak, atau hukum.</p>
        </article>
        <article class="panel">${panelHead("Konteks yang Dikirim")}
          <dl class="key-values"><dt>Net worth</dt><dd>${fmt(netWorth())}</dd><dt>Likuiditas</dt><dd>${fmt(cash())}</dd><dt>Utang</dt><dd>${fmt(debt())}</dd><dt>Unfunded</dt><dd>${fmt(unfunded())}</dd><dt>Aset</dt><dd>${data.assets.length} item</dd><dt>Agenda</dt><dd>${data.events.length} item</dd></dl>
          <p class="note">Hanya ringkasan terstruktur dan pertanyaan yang dikirim; dokumen vault tidak dikirim otomatis.</p>
        </article>
      </div>`;
  }

  function reportHtml() {
    const alloc = allocation();
    return `<article class="report">
      <p class="eyebrow">${escapeHtml(data.profile.family)} · LegacyOS</p>
      <h1>Laporan Konsolidasi</h1>
      <p>Per ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} · ${data.mode === "demo" ? "DATA CONTOH" : "DATA PENGGUNA"}</p>
      <div class="report-stats"><div class="report-stat"><strong>${fmt(netWorth())}</strong><span>Net worth</span></div><div class="report-stat"><strong>${fmt(cash())}</strong><span>Likuiditas</span></div><div class="report-stat"><strong>${fmt(debt())}</strong><span>Utang bruto</span></div><div class="report-stat"><strong>${data.ytd >= 0 ? "+" : ""}${pct(data.ytd)}</strong><span>Kinerja YTD</span></div><div class="report-stat"><strong>${fmt(unfunded())}</strong><span>Unfunded</span></div><div class="report-stat"><strong>${data.assets.length}</strong><span>Aset terdaftar</span></div></div>
      <h2>Alokasi Aset</h2>
      <table><thead><tr><th>Kelas</th><th class="number">Nilai</th><th class="number">Bobot</th></tr></thead><tbody>${alloc.map((item) => `<tr><td class="name">${escapeHtml(item.key)}</td><td class="number">${fmt(item.value)}</td><td class="number">${pct(item.percent)}</td></tr>`).join("")}</tbody></table>
      <h2>Kewajiban</h2>
      <table><thead><tr><th>Fasilitas</th><th class="number">Pokok</th><th>Tempo</th></tr></thead><tbody>${data.liabilities.map((item) => `<tr><td class="name">${escapeHtml(item.facility)}</td><td class="number">${fmt(item.amount)}</td><td>${escapeHtml(item.due)}</td></tr>`).join("") || `<tr><td colspan="3">Tidak ada kewajiban.</td></tr>`}</tbody></table>
      <h2>Agenda 90 Hari</h2>
      ${data.events.map((event) => `<p><strong>${escapeHtml(event.date)}</strong> — ${escapeHtml(event.title)} · ${escapeHtml(event.detail)}</p>`).join("") || "<p>Belum ada agenda.</p>"}
      <h2>Catatan</h2>
      <p>Dokumen ini dihasilkan dari data pada browser pengguna. Validasi nilai, kepemilikan, pajak, dan kewajiban bersama penasihat profesional sebelum mengambil keputusan.</p>
    </article>`;
  }

  function renderReports() {
    return pageHeader("Intelijen", "Pelaporan", "Pratinjau laporan konsolidasi yang dapat dicetak atau disimpan sebagai PDF.") + `
      <div class="toolbar"><span class="chip ${data.mode === "demo" ? "warning" : "success"}">${data.mode === "demo" ? "DATA CONTOH" : "DATA ANDA"}</span><button class="btn gold" type="button" data-action="report-print">Cetak / Simpan PDF</button></div>
      <div style="overflow:auto;border-radius:11px">${reportHtml()}</div>`;
  }

  function renderDataCenter() {
    return pageHeader("Intelijen", "Pusat Data & Pindai", "Impor, ekspor, reset, serta ekstraksi dokumen melalui fungsi AI server-side.") + `
      <div class="alert-strip">
        <div class="alert ${data.mode === "demo" ? "warning" : "success"}"><strong>⌗</strong><span><b>Mode ${data.mode === "demo" ? "DEMO" : "DATA ANDA"}</b><span>${data.assets.length} aset · ${data.transactions.length} transaksi</span></span></div>
        <div class="alert info"><strong>▣</strong><span><b>Penyimpanan browser</b><span>Ekspor JSON untuk backup lintas perangkat</span></span></div>
      </div>
      <div class="grid cols-2">
        <article class="panel">
          ${panelHead("Pindai Dokumen dengan AI", `<span class="chip info">via Vercel AI Gateway</span>`)}
          <button id="drop-zone" class="drop-zone" type="button" data-action="scan-file"><span style="font-size:26px">⌗</span><b>Pilih foto, PDF, atau berkas teks</b><span>Maksimum 2,5 MB · tinjau hasil sebelum menyimpan</span></button>
          <input id="scan-file-input" type="file" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,text/csv" hidden>
          <p class="muted" style="margin:11px 0 7px;text-align:center;font-size:10px">— atau tempel teks —</p>
          <textarea id="scan-text" rows="6" placeholder="Tempel isi surat dividen, invoice, mutasi rekening, atau capital call…"></textarea>
          <div class="chip-row" style="margin-top:10px"><button class="btn gold" type="button" data-action="scan-run">Pindai teks</button><button class="btn" type="button" data-action="scan-sample">Muat contoh</button></div>
          <p class="note">Jika fungsi AI belum dikonfigurasi, LegacyOS memakai ekstraksi lokal sederhana dan meminta Anda memeriksa hasil.</p>
        </article>
        <div class="stack">
          <article class="panel">${panelHead("Backup & Perpindahan")}
            <div class="stack"><button class="btn" type="button" data-action="export-json">Ekspor cadangan JSON</button><button class="btn" type="button" data-action="export-assets">Ekspor CSV aset</button><button class="btn" type="button" data-action="import-json">Impor JSON…</button></div>
            <input id="import-file" type="file" accept="application/json,.json" hidden>
            <p class="note">Backup berisi data aplikasi, bukan kunci API atau berkas dokumen asli.</p>
          </article>
          <article class="panel">${panelHead("Identitas Kantor")}
            <form id="settings-form" class="stack"><label class="field"><span>Nama keluarga / kantor</span><input name="family" value="${escapeHtml(data.profile.family)}" required></label><label class="field"><span>Kurs IDR per USD</span><input name="rate" type="number" value="${Number(data.profile.currencyRate || 16450)}" required></label><button class="btn gold" type="submit">Simpan pengaturan</button></form>
          </article>
          <article class="panel" style="border-color:#5a3434">${panelHead("Zona Data")}
            <div class="stack"><button class="btn" type="button" data-action="reset-demo">Muat ulang data contoh</button><button class="btn danger" type="button" data-action="reset-empty">Mulai dari data kosong</button></div>
          </article>
        </div>
      </div>`;
  }

  const RENDERERS = {
    dash: renderDashboard,
    assets: renderAssets,
    banking: renderBanking,
    analytics: renderAnalytics,
    tax: renderTax,
    liab: renderLiabilities,
    tree: renderFamily,
    struct: renderStructure,
    invest: renderInvestments,
    board: renderBoard,
    constitution: renderConstitution,
    succession: renderSuccession,
    estate: renderEstate,
    giving: renderGiving,
    vault: renderVault,
    edu: renderEducation,
    comms: renderCommunication,
    insurance: renderInsurance,
    security: renderSecurity,
    ai: renderAI,
    reports: renderReports,
    data: renderDataCenter,
  };

  function afterRender(section) {
    if (section === "analytics") updateStress();
    if (section === "ai") {
      const log = $("#ai-log");
      if (log) log.scrollTop = log.scrollHeight;
    }
    if (section === "comms") {
      $("#post-form")?.addEventListener("submit", handlePost);
    }
    if (section === "ai") {
      $("#ai-form")?.addEventListener("submit", handleAIForm);
    }
    if (section === "data") {
      $("#settings-form")?.addEventListener("submit", handleSettings);
      const drop = $("#drop-zone");
      drop?.addEventListener("dragover", (event) => {
        event.preventDefault();
        drop.classList.add("drag");
      });
      drop?.addEventListener("dragleave", () => drop.classList.remove("drag"));
      drop?.addEventListener("drop", (event) => {
        event.preventDefault();
        drop.classList.remove("drag");
        handleScanFile(event.dataTransfer.files[0]);
      });
    }
  }

  function updateStress() {
    const fields = {
      property: $("#stress-property"),
      private: $("#stress-private"),
      public: $("#stress-public"),
      cash: $("#stress-cash"),
    };
    if (!fields.property) return;
    for (const [key, input] of Object.entries(fields)) {
      const value = Number(input.value);
      $(`#stress-${key}-value`).textContent = `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value)}%`;
    }
    const alloc = Object.fromEntries(allocation().map((item) => [item.key, item.value]));
    const changes = {
      property: Number(fields.property.value),
      private: Number(fields.private.value),
      public: Number(fields.public.value),
      cash: Number(fields.cash.value),
    };
    const delta =
      (alloc["Real Estat"] || 0) * changes.property / 100
      + (alloc["Private Equity"] || 0) * changes.private / 100 * 0.7
      + (alloc["Pasar Publik"] || 0) * changes.public / 100
      + (alloc.Likuiditas || 0) * changes.cash / 100;
    const scenario = netWorth() + delta;
    $("#stress-result").innerHTML = `<span class="kpi-label">Dampak pada net worth</span><strong class="${delta >= 0 ? "up" : "down"}">${fmt(delta)}</strong><p>NW skenario: <span class="name">${fmt(scenario)}</span></p><p class="note">Likuiditas / NW skenario: ${scenario ? pct((cash() / scenario) * 100) : "—"}</p>`;
  }

  function openAsset(id) {
    const asset = data.assets.find((item) => item.id === id);
    if (!asset) return;
    const body = `<div class="chip-row"><span class="chip gold">${escapeHtml(asset.category)}</span>${statusChip(asset.risk)}</div>
      <dl class="key-values"><dt>Nilai</dt><dd class="name">${fmt(asset.value)}</dd><dt>Lokasi</dt><dd>${escapeHtml(asset.location)}</dd><dt>Pemilik</dt><dd>${escapeHtml(asset.owner)}</dd><dt>Catatan</dt><dd>${escapeHtml(asset.note || "—")}</dd></dl>
      <p class="note">Metadata tersimpan di browser. Tidak ada dokumen asli pada aplikasi statis ini.</p>`;
    const actions = canEdit() ? `<button class="btn danger" type="button" data-action="asset-delete" data-id="${escapeHtml(asset.id)}">Hapus</button><button class="btn" type="button" data-action="asset-edit" data-id="${escapeHtml(asset.id)}">Edit</button>` : "";
    openModal(asset.name, body, actions);
  }

  function assetForm(asset = null) {
    if (!canEdit()) return;
    openForm(asset ? "Edit Aset" : "Tambah Aset", [
      { name: "name", label: "Nama aset", value: asset?.name, required: true, autofocus: true },
      { name: "category", label: "Kategori", type: "select", value: asset?.category || "Real Estat", options: ["Real Estat", "Perusahaan", "Investasi Privat", "Pasar Publik", "Alternatif", "Kripto"] },
      { name: "value", label: "Nilai (miliar Rp)", type: "number", value: asset?.value, required: true },
      { name: "risk", label: "Risiko", type: "select", value: asset?.risk || "Menengah", options: ["Rendah", "Menengah", "Tinggi"] },
      { name: "location", label: "Lokasi", value: asset?.location },
      { name: "owner", label: "Pemilik / entitas", value: asset?.owner },
      { name: "note", label: "Catatan", type: "textarea", full: true, value: asset?.note },
    ], (values) => {
      const value = Number(values.value);
      if (!values.name || value <= 0) {
        toast("Nama dan nilai positif wajib diisi.", "warning");
        return;
      }
      const record = { id: asset?.id || `a-${Date.now()}`, name: values.name, category: values.category, value, risk: values.risk, location: values.location || "—", owner: values.owner || "—", note: values.note || "" };
      if (asset) Object.assign(asset, record);
      else data.assets.unshift(record);
      data.mode = "live";
      save(asset ? "Aset diperbarui." : "Aset ditambahkan.");
      closeModal();
      go("assets", false);
    });
  }

  function bankForm(bank = null) {
    if (!canEdit()) return;
    openForm(bank ? "Edit Rekening" : "Tambah Rekening", [
      { name: "bank", label: "Bank / kustodian", value: bank?.bank, required: true, autofocus: true },
      { name: "purpose", label: "Fungsi", value: bank?.purpose || "Operasional" },
      { name: "currency", label: "Mata uang", type: "select", value: bank?.currency || "IDR", options: ["IDR", "USD", "SGD", "EUR"] },
      { name: "balance", label: "Saldo ekuivalen (miliar Rp)", type: "number", value: bank?.balance, required: true },
      { name: "account", label: "Nomor rekening tersamar", value: bank?.account || "•• 0000" },
    ], (values) => {
      const record = { id: bank?.id || `b-${Date.now()}`, bank: values.bank, purpose: values.purpose, currency: values.currency, balance: Number(values.balance || 0), account: values.account };
      if (bank) Object.assign(bank, record);
      else data.banks.push(record);
      data.mode = "live";
      save("Rekening disimpan.");
      closeModal();
      go("banking", false);
    });
  }

  function transactionForm(prefill = {}) {
    if (!canEdit()) return;
    const accountOptions = data.banks.length ? data.banks.map((bank) => bank.bank) : ["Kas Utama"];
    openForm("Entri Transaksi", [
      { name: "type", label: "Jenis", type: "select", value: prefill.type || "pemasukan", options: ["dividen", "pemasukan", "setoran", "beban", "pajak", "capital_call", "penarikan"] },
      { name: "amount", label: "Jumlah (miliar Rp)", type: "number", value: prefill.amount || "", required: true },
      { name: "description", label: "Deskripsi", value: prefill.description || "", required: true, full: true },
      { name: "account", label: "Rekening", type: "select", value: prefill.account || accountOptions[0], options: accountOptions },
      { name: "date", label: "Tanggal", value: prefill.date || new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) },
    ], (values) => {
      const amount = Number(values.amount);
      if (amount <= 0 || !values.description) {
        toast("Jumlah positif dan deskripsi wajib diisi.", "warning");
        return;
      }
      let bank = data.banks.find((item) => item.bank === values.account);
      if (!bank) {
        bank = { id: `b-${Date.now()}`, bank: values.account, purpose: "Dibuat otomatis", currency: "IDR", balance: 0, account: "—" };
        data.banks.push(bank);
      }
      const direction = /beban|pajak|capital_call|penarikan/.test(values.type) ? -1 : 1;
      bank.balance = Number(bank.balance || 0) + direction * amount;
      data.transactions.unshift({ id: `t-${Date.now()}`, date: values.date, type: values.type, description: values.description, account: bank.bank, amount, direction, source: prefill.source || "manual" });
      data.mode = "live";
      save("Transaksi dicatat dan saldo diperbarui.");
      closeModal();
      go("banking", false);
    });
  }

  function liabilityForm() {
    if (!canEdit()) return;
    openForm("Tambah Fasilitas Kredit", [
      { name: "facility", label: "Nama fasilitas", required: true, autofocus: true },
      { name: "lender", label: "Kreditur" },
      { name: "amount", label: "Pokok (miliar Rp)", type: "number", required: true },
      { name: "rate", label: "Bunga", value: "8,0%" },
      { name: "due", label: "Jatuh tempo", value: "2028" },
      { name: "covenant", label: "Kovenan", value: "—" },
    ], (values) => {
      if (!values.facility || Number(values.amount) <= 0) return toast("Nama dan pokok wajib diisi.", "warning");
      data.liabilities.push({ id: `l-${Date.now()}`, facility: values.facility, lender: values.lender || "—", amount: Number(values.amount), rate: values.rate, due: values.due, covenant: values.covenant, status: "Aman" });
      data.mode = "live";
      save("Fasilitas kredit ditambahkan.");
      closeModal();
      go("liab", false);
    });
  }

  function handlePost(event) {
    event.preventDefault();
    const input = $("#post-input");
    const text = input.value.trim();
    if (!text) return;
    data.posts.unshift({ author: role().label, date: "Baru saja", text });
    data.mode = "live";
    save("Pengumuman disimpan.");
    go("comms", false);
  }

  function handleSettings(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    data.profile.family = values.family.trim() || "Family Office Anda";
    data.profile.currencyRate = Number(values.rate || 16450);
    data.mode = "live";
    save("Pengaturan disimpan.");
    updateIdentity();
    go("data", false);
  }

  async function apiRequest(action, payload) {
    const response = await fetch("/api/anthropic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    return result;
  }

  function aiContext() {
    return {
      family: data.profile.family,
      mode: data.mode,
      netWorth: netWorth(),
      grossAssets: grossAssets(),
      cash: cash(),
      debt: debt(),
      unfunded: unfunded(),
      ytd: data.ytd,
      benchmark: data.benchmark,
      allocation: allocation().map((item) => ({ category: item.key, value: item.value, percent: Number(item.percent.toFixed(1)) })),
      largestAssets: [...data.assets].sort((a, b) => b.value - a.value).slice(0, 6).map(({ name, category, value, risk }) => ({ name, category, value, risk })),
      liabilities: data.liabilities.map(({ facility, amount, due, status }) => ({ facility, amount, due, status })),
      events: data.events.slice(0, 8),
    };
  }

  function localAdvisor(question) {
    const q = question.toLowerCase();
    const realEstate = allocation().find((item) => item.key === "Real Estat");
    if (/properti|real estat/.test(q) && /turun|dampak|20/.test(q)) {
      const impact = (realEstate?.value || 0) * -0.2;
      return `Simulasi properti −20% memberi dampak sekitar ${fmt(impact)} pada nilai portofolio. Net worth indikatif menjadi ${fmt(netWorth() + impact)}. Likuiditas tetap ${fmt(cash())}; rasio kas terhadap NW skenario sekitar ${pct((cash() / Math.max(netWorth() + impact, 1)) * 100)}. Gunakan Portfolio Analytics untuk mengubah asumsi.`;
    }
    if (/utang|kewajiban|leverage|komitmen/.test(q)) {
      return `Utang bruto ${fmt(debt())}, kas ${fmt(cash())}, sehingga posisi net cash ${fmt(cash() - debt())}. Komitmen belum ditarik ${fmt(unfunded())}, setara ${cash() ? pct((unfunded() / cash()) * 100) : "—"} dari likuiditas. Periksa konsentrasi jatuh tempo dan kovenan pada modul Kewajiban & Leverage.`;
    }
    if (/agenda|tenggat|dekat/.test(q)) {
      return data.events.length
        ? `Agenda terdekat: ${data.events.slice(0, 4).map((event) => `${event.date} — ${event.title}`).join("; ")}.`
        : "Belum ada agenda yang tercatat.";
    }
    return `Net worth saat ini ${fmt(netWorth())}, likuiditas ${fmt(cash())}, utang ${fmt(debt())}, dan komitmen belum ditarik ${fmt(unfunded())}. Kinerja YTD ${data.ytd >= 0 ? "+" : ""}${pct(data.ytd)} dibanding benchmark ${data.benchmark >= 0 ? "+" : ""}${pct(data.benchmark)}. Ini ringkasan analitik lokal; keputusan tetap melalui penasihat dan komite yang berwenang.`;
  }

  async function askAI(question) {
    const clean = question.trim();
    if (!clean) return;
    state.aiMessages.push({ role: "user", content: clean }, { role: "assistant", content: "Menganalisis…" });
    go("ai", false);
    try {
      const history = state.aiMessages
        .filter((message) => message.content !== "Menganalisis…")
        .slice(-10)
        .map(({ role: messageRole, content }) => ({ role: messageRole, content }));
      const result = await apiRequest("advisor", { messages: history, context: aiContext() });
      state.aiMessages[state.aiMessages.length - 1] = { role: "assistant", content: result.text };
    } catch (error) {
      state.aiMessages[state.aiMessages.length - 1] = {
        role: "assistant",
        content: `${localAdvisor(clean)}\n\nMode analitik lokal: ${error.message}`,
      };
    }
    if (state.section === "ai") go("ai", false);
  }

  function handleAIForm(event) {
    event.preventDefault();
    const input = $("#ai-input");
    const question = input.value;
    input.value = "";
    askAI(question);
  }

  function scanFallback(text) {
    const matches = [...String(text).matchAll(/rp\s*([\d.]+(?:,\d+)?)/gi)]
      .map((match) => Number(match[1].replace(/\./g, "").replace(",", ".")))
      .filter(Number.isFinite);
    const rupiah = matches.length ? Math.max(...matches) : 0;
    let type = "pemasukan";
    if (/dividen/i.test(text)) type = "dividen";
    else if (/pajak|pph|ppn/i.test(text)) type = "pajak";
    else if (/capital\s*call/i.test(text)) type = "capital_call";
    else if (/invoice|tagihan|beban/i.test(text)) type = "beban";
    return {
      type,
      description: String(text).split(/\n/).map((line) => line.trim()).find((line) => line.length > 10)?.slice(0, 70) || "Dokumen dipindai",
      amount: rupiah / 1e9,
      date: "",
      account: data.banks[0]?.bank || "Kas Utama",
      confidence: rupiah ? 0.45 : 0.2,
      note: "Ekstraksi lokal — periksa angka sebelum menyimpan.",
    };
  }

  function normalizeScan(result) {
    return {
      type: result.type || result.jenis || "pemasukan",
      description: result.description || result.deskripsi || "Dokumen dipindai",
      amount: Number(result.amount ?? (Number(result.jumlah_rupiah || 0) / 1e9)),
      date: result.date || result.tanggal || "",
      account: result.account || result.rekening_saran || data.banks[0]?.bank || "Kas Utama",
      confidence: Number(result.confidence ?? result.keyakinan ?? 0),
      note: result.note || result.catatan || "",
    };
  }

  function stageScan(result) {
    const scan = normalizeScan(result);
    state.scanResult = scan;
    transactionForm({ ...scan, source: "pindai" });
    const confidence = Math.round(scan.confidence * 100);
    toast(`Hasil pindai siap ditinjau · keyakinan ${confidence}%`, confidence >= 70 ? "success" : "warning");
  }

  async function runTextScan() {
    const text = $("#scan-text")?.value.trim();
    if (!text) return toast("Tempel teks dokumen terlebih dahulu.", "warning");
    toast("Menganalisis dokumen…");
    try {
      const result = await apiRequest("extract", { text });
      stageScan(result.data);
    } catch (error) {
      stageScan(scanFallback(text));
    }
  }

  async function handleScanFile(file) {
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) return toast("Berkas maksimum 2,5 MB.", "warning");
    toast("Membaca berkas…");
    if (file.type.startsWith("text/")) {
      const text = await file.text();
      try {
        const result = await apiRequest("extract", { text });
        stageScan(result.data);
      } catch (error) {
        stageScan(scanFallback(text));
      }
      return;
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const base64 = String(dataUrl).split(",")[1];
    try {
      const result = await apiRequest("extract", { file: { mediaType: file.type, data: base64, name: file.name } });
      stageScan(result.data);
    } catch (error) {
      stageScan({ type: "beban", description: file.name, amount: 0, confidence: 0.1, note: `AI belum tersedia: ${error.message}` });
    }
  }

  function download(name, content, type = "application/json") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportJson() {
    download(`legacyos-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: "LegacyOS", version: 1, exportedAt: new Date().toISOString(), data }, null, 2));
    toast("Cadangan JSON diunduh.");
  }

  function exportAssetsCsv() {
    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["nama", "kategori", "nilai_miliar", "lokasi", "pemilik", "risiko", "catatan"],
      ...data.assets.map((asset) => [asset.name, asset.category, asset.value, asset.location, asset.owner, asset.risk, asset.note]),
    ];
    download("legacyos-aset.csv", rows.map((row) => row.map(escapeCsv).join(",")).join("\n"), "text/csv;charset=utf-8");
    toast("CSV aset diunduh.");
  }

  function importJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const candidate = parsed.data || parsed.core || parsed;
        if (!candidate || !Array.isArray(candidate.assets)) throw new Error("Struktur tidak dikenali");
        data = mergeData(candidate);
        data.mode = "live";
        save("Cadangan berhasil diimpor.");
        updateIdentity();
        go("dash");
      } catch (error) {
        toast(`Impor gagal: ${error.message}`, "warning");
      }
    };
    reader.readAsText(file);
  }

  function updateIdentity() {
    const family = data.profile.family || "Family Office Anda";
    $("#family-label").textContent = family;
    const initial = family.replace(/^keluarga\s+/i, "").trim()[0]?.toUpperCase() || "L";
    $("#brand-seal").textContent = initial;
    $("#login-seal").textContent = initial;
    $("#mode-chip").textContent = data.mode === "demo" ? "DEMO" : "DATA ANDA";
    $("#mode-chip").className = `chip ${data.mode === "demo" ? "warning" : "success"}`;
  }

  function updateRole() {
    const active = role();
    $("#avatar").textContent = active.initials;
    $("#avatar").title = active.label;
    const banner = $("#read-only-banner");
    banner.hidden = active.edit;
    banner.textContent = active.edit ? "" : "Mode read-only — perubahan, voting, dan entri data dinonaktifkan pada antarmuka.";
    if (!allowed(state.section)) {
      state.section = active.allow === "*" ? "dash" : active.allow[0];
    }
    renderNav();
    go(state.section, false);
  }

  function handleViewClick(event) {
    const moduleButton = event.target.closest("[data-module]");
    if (moduleButton) return go(moduleButton.dataset.module);
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    const { action, id, value, vote, question } = actionButton.dataset;
    if (action === "asset-filter") {
      state.assetFilter = value;
      return go("assets", false);
    }
    if (action === "asset-open") return openAsset(id);
    if (action === "asset-add") return assetForm();
    if (action === "asset-edit") {
      closeModal();
      return assetForm(data.assets.find((item) => item.id === id));
    }
    if (action === "asset-delete") {
      data.assets = data.assets.filter((item) => item.id !== id);
      data.mode = "live";
      save("Aset dihapus.");
      closeModal();
      return go("assets", false);
    }
    if (action === "bank-add") return bankForm();
    if (action === "bank-edit") return bankForm(data.banks.find((item) => item.id === id));
    if (action === "transaction-add") return transactionForm();
    if (action === "liability-add") return liabilityForm();
    if (action === "proposal-vote") {
      const proposal = data.proposals.find((item) => item.id === id);
      if (!proposal || !role().vote) return;
      if (vote === "yes") proposal.yes += 1;
      else proposal.no += 1;
      if (proposal.yes >= proposal.required) proposal.status = "Disetujui";
      data.mode = "live";
      save(`Suara ${vote === "yes" ? "SETUJU" : "TOLAK"} dicatat pada browser ini.`);
      return go("invest", false);
    }
    if (action === "ai-quick") return askAI(question);
    if (action === "report-print") {
      $("#print-sheet").innerHTML = reportHtml();
      return window.print();
    }
    if (action === "scan-run") return runTextScan();
    if (action === "scan-sample") {
      $("#scan-text").value = "PT ABC MANUFAKTUR\nSURAT PEMBERITAHUAN DIVIDEN INTERIM\nTanggal: 11 Juli 2026\nDividen interim sebesar Rp 14.400.000.000 akan ditransfer ke rekening BCA Prioritas.";
      return toast("Contoh dimuat.");
    }
    if (action === "scan-file") return $("#scan-file-input").click();
    if (action === "export-json") return exportJson();
    if (action === "export-assets") return exportAssetsCsv();
    if (action === "import-json") return $("#import-file").click();
    if (action === "reset-demo") {
      if (!window.confirm("Ganti seluruh data browser ini dengan data contoh?")) return;
      data = clone(DEFAULT_DATA);
      save("Data contoh dimuat ulang.");
      updateIdentity();
      return go("dash");
    }
    if (action === "reset-empty") {
      if (!window.confirm("Mulai dari data kosong? Ekspor backup terlebih dahulu bila perlu.")) return;
      data = clone(EMPTY_DATA);
      save("LegacyOS dimulai dari data kosong.");
      updateIdentity();
      return go("data");
    }
  }

  function handleModalClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    if (button.dataset.action === "modal-close") closeModal();
    else handleViewClick(event);
  }

  function initialize() {
    updateIdentity();
    $("#role-select").innerHTML = Object.entries(ROLES).map(([key, item]) => `<option value="${key}">${escapeHtml(item.label)}</option>`).join("");
    $("#role-select").value = state.role;
    $("#login-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const login = $("#login");
      login.style.pointerEvents = "none";
      login.style.opacity = "0";
      window.setTimeout(() => {
        login.hidden = true;
        login.style.removeProperty("opacity");
        login.style.removeProperty("pointer-events");
        $("#app").hidden = false;
        updateRole();
        toast("Sesi demo dimulai. Gunakan data contoh atau mulai dari data kosong.");
      }, 240);
    });
    $("#nav").addEventListener("click", handleViewClick);
    $("#view").addEventListener("click", handleViewClick);
    $("#view").addEventListener("input", (event) => {
      if (event.target.matches('input[type="range"][id^="stress-"]')) updateStress();
    });
    $("#modal").addEventListener("click", handleModalClick);
    $("#modal-root").addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeModal();
    });
    $("#menu-button").addEventListener("click", () => $("#rail").classList.toggle("open"));
    $("#currency-button").addEventListener("click", () => {
      state.currency = state.currency === "IDR" ? "USD" : "IDR";
      $("#currency-button").textContent = state.currency;
      go(state.section, false);
      toast(state.currency === "USD" ? "Tampilan dikonversi ke USD secara indikatif." : "Tampilan kembali ke Rupiah.");
    });
    $("#role-select").addEventListener("change", (event) => {
      state.role = event.target.value;
      updateRole();
      toast(`Peran aktif: ${role().label}`);
    });
    $("#notification-button").addEventListener("click", () => toast(data.events[0] ? `${data.events[0].date}: ${data.events[0].title}` : "Tidak ada notifikasi."));
    $("#global-search").addEventListener("input", (event) => {
      const query = event.target.value.trim();
      if (!query) return;
      state.assetQuery = query;
      state.assetFilter = "Semua";
      if (data.assets.some((asset) => `${asset.name} ${asset.location} ${asset.owner}`.toLowerCase().includes(query.toLowerCase()))) go("assets", false);
    });
    $("#scan-file-input")?.addEventListener("change", (event) => handleScanFile(event.target.files[0]));
    document.addEventListener("change", (event) => {
      if (event.target.id === "scan-file-input") handleScanFile(event.target.files[0]);
      if (event.target.id === "import-file") importJson(event.target.files[0]);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#modal-root").hidden) closeModal();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        $("#global-search").focus();
      }
    });
  }

  initialize();
})();
