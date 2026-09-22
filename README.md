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
dari WordPress, lalu meneruskannya ke slider. Ini otomatis menghindari
masalah CORS, dan sekalian di-cache 10 menit di edge Cloudflare supaya
website WordPress sekolah tidak dibebani permintaan berulang dari tiap
layar/HP yang membuka slider.

## 1. Cek dulu: apakah REST API WordPress aktif

Buka di browser: `https://smkmuhammadiyahtodanan.sch.id/wp-json/wp/v2/posts`

- Kalau muncul teks/JSON panjang berisi data artikel → aktif, lanjut ke langkah 2.
- Kalau muncul error atau halaman kosong → kemungkinan ada plugin keamanan
  (Wordfence, iThemes Security, dll.) yang memblokir REST API. Masuk ke
  pengaturan plugin tersebut dan izinkan akses ke `wp-json` untuk publik (GET
  saja, tidak perlu izin tulis).

## 2. Deploy ke Cloudflare Pages

Struktur folder yang perlu di-deploy (semuanya ada di paket ini):
```
index.html
manifest.json
service-worker.js
icons/
functions/
  api/
    articles.js
```

**Cara A — Upload langsung lewat dashboard (paling cepat, tanpa akun GitHub):**
1. Buka dashboard Cloudflare → **Workers & Pages** → **Create application** → tab **Pages** → **Upload assets**
2. Beri nama project, misalnya `berita-muhada`
3. Upload/drag seluruh isi folder paket ini (termasuk folder `functions/` —
   jangan sampai tertinggal, karena di situlah proxy anti-CORS-nya berada)
4. Klik **Deploy** — Cloudflare otomatis mendeteksi folder `functions/` dan
   mengaktifkannya sebagai Pages Function
5. Setelah selesai, Anda dapat URL seperti `https://berita-muhada.pages.dev`

**Cara B — Lewat GitHub (kalau mau versi bisa di-update lewat git push):**
1. Push folder ini ke sebuah repository GitHub
2. Di Cloudflare Pages → **Connect to Git** → pilih repo tersebut
3. Build settings: kosongkan "Build command", set "Build output directory" ke `/` (root)
4. Deploy

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
