# Berita SMK Muhammadiyah Todanan — Slider Otomatis (PWA)

Aplikasi slider fullscreen otomatis yang menampilkan 20 artikel terbaru dari
website sekolah (judul + foto artikel sebagai background), dan bisa dipakai di
TV/monitor lobi, HP, tablet, maupun komputer.

## Arsitektur

Karena halaman slider ini di-deploy di **Cloudflare Pages** (domain berbeda
dari website WordPress sekolah), pengambilan data TIDAK dilakukan langsung
dari browser ke WordPress — itu akan diblokir aturan CORS browser. Sebagai
gantinya:

```
Browser (slider)  →  /api/articles  (Cloudflare Pages Function, di edge)
                          ↓
                   WordPress REST API
                   (wp-json/wp/v2/posts)
```

`functions/api/articles.js` berjalan di server/edge Cloudflare, mengambil data
dari WordPress, lalu meneruskannya ke slider.

## ⚠️ Penting: cara deploy yang WAJIB dipakai

Cloudflare **tidak mendukung folder `functions/` kalau di-deploy lewat
"Upload assets" di dashboard (drag & drop)** — proxy anti-CORS-nya tidak akan
aktif kalau pakai cara itu. Gunakan salah satu dari dua cara di bawah ini.

## 1. Cek dulu: apakah REST API WordPress aktif

Buka di browser: `https://smkmuhammadiyahtodanan.sch.id/wp-json/wp/v2/posts`

- Kalau muncul teks/JSON panjang berisi data artikel → aktif, lanjut ke langkah 2.
- Kalau muncul error atau halaman kosong → kemungkinan ada plugin keamanan
  (Wordfence, iThemes Security, dll.) yang memblokir REST API. Masuk ke
  pengaturan plugin tersebut dan izinkan akses ke `wp-json` untuk publik (GET
  saja, tidak perlu izin tulis).

## 2. Deploy ke Cloudflare Pages (2 cara yang benar-benar berfungsi)

### Cara A — Lewat GitHub (disarankan, tidak perlu install apa pun)

1. Buat akun gratis di [github.com](https://github.com) kalau belum punya
2. Klik **New repository** → beri nama, misalnya `berita-muhada` → **Create repository**
3. Di halaman repo kosong itu, klik **uploading an existing file**
4. Drag SEMUA isi paket ini ke situ — termasuk folder `functions/` (GitHub
   akan otomatis membuat strukturnya kalau Anda drag foldernya langsung dari
   File Explorer/Finder) — lalu **Commit changes**
5. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages**
   → **Create application** → tab **Pages** → **Connect to Git**
6. Pilih repo `berita-muhada` tadi
7. Di pengaturan build: kosongkan **Build command**, isi **Build output directory**
   dengan `/`
8. **Save and Deploy**

Kelebihan cara ini: kalau nanti mau update kode, tinggal edit file di GitHub
dan Cloudflare otomatis deploy ulang.

### Cara B — Lewat Wrangler CLI (kalau terbiasa pakai terminal)

Perlu Node.js terinstal di komputer. Dari folder paket ini, jalankan:
```
npx wrangler pages deploy . --project-name=berita-muhada
```
Wrangler akan minta login ke akun Cloudflare Anda (buka browser otomatis),
lalu meng-upload semua file TERMASUK folder `functions/` dengan benar.

## 3. Pasang di TV/monitor lobi (kiosk)

- Sambungkan mini PC / laptop bekas / Raspberry Pi ke TV
- Buka Chrome, akses `https://berita-muhada.pages.dev` (sesuaikan dengan nama project Anda)
- Aktifkan mode kiosk: `chrome --kiosk https://berita-muhada.pages.dev`
- Set browser untuk otomatis membuka halaman ini setiap kali perangkat menyala

## 4. Install di HP / Tablet / Komputer

- Buka alamat slider (`https://berita-muhada.pages.dev`) di Chrome/Safari
- Chrome Android: menu (⋮) → "Tambahkan ke layar Utama" / "Install app"
- Safari iOS: tombol Share → "Tambah ke Layar Utama"
- Chrome Desktop: ikon install (⊕) di address bar

Setelah di-install, ikon aplikasi akan muncul seperti aplikasi native dan
terbuka fullscreen tanpa address bar.

## Cara memastikan proxy-nya sudah aktif

Setelah deploy (Cara A atau B di atas), buka langsung:
```
https://berita-muhada.pages.dev/api/articles
```
Kalau muncul data JSON artikel → proxy aktif, slider akan bekerja.
Kalau muncul halaman 404 "page not found" → berarti folder `functions/`
tidak ikut ter-deploy (cek lagi apakah foldernya benar-benar ada di repo
GitHub / ikut ter-upload oleh Wrangler).

## (Opsional) Kalau ingin domain sendiri, bukan *.pages.dev

Cloudflare Pages mendukung custom domain gratis — misalnya
`tv.smkmuhammadiyahtodanan.sch.id` — asalkan DNS domain sekolah dikelola atau
bisa diarahkan lewat Cloudflare. Ini opsional; `*.pages.dev` bawaan sudah
cukup untuk kiosk TV dan install PWA.

## Cara kerja & pengaturan

- Slider meminta data ke `/api/articles` (proxy di edge Cloudflare), yang
  meneruskan ke `/wp-json/wp/v2/posts?per_page=20&_embed` di website sekolah
- Slider otomatis maju tiap **8 detik** (bisa diubah di `index.html`,
  cari `slideDurationMs`)
- Data disegarkan otomatis tiap **15 menit** tanpa reload halaman
  (`refreshDataEveryMs`), dan di edge Cloudflare hasilnya di-cache 10 menit
  (atur di `functions/api/articles.js`, `cacheTtl`)
- Kalau internet putus, aplikasi tetap menampilkan artikel terakhir yang
  tersimpan di cache
- Bisa navigasi manual: tap kiri/kanan layar, swipe, atau tombol panah kiri/kanan
- Artikel tanpa foto akan tetap tampil dengan latar warna biru tua brand
  Muhada Berdaya, bukan layar kosong

## Kalau mau ganti warna atau kecepatan slide

Semua token warna ada di bagian atas `index.html`:
```css
--biru-tua:#1B2E6E;
--biru-terang:#1A6FE8;
--oranye:#F28C00;
```
