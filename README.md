# Berita SMK Muhammadiyah Todanan — Slider Otomatis (PWA)

Slider fullscreen otomatis yang menampilkan artikel terbaru dari website
sekolah (judul + foto sebagai background), dipakai di TV lobi, HP, tablet,
maupun komputer. Di-deploy di Cloudflare Pages lewat GitHub.

## Struktur proyek

```
index.html               halaman utama slider
manifest.json / icons/    supaya bisa di-install seperti aplikasi
service-worker.js         caching offline
functions/api/articles.js proxy WordPress REST API (hindari CORS)
functions/api/image.js    proxy gambar (hindari hotlink/CORS + resolusi tinggi)
functions/api/position.js penyimpanan posisi foto manual (perlu KV, opsional)
functions/r/[id].js       link pendek untuk QR code (redirect ke artikel asli)
```

## 1. Cek REST API WordPress aktif

Buka: `https://smkmuhammadiyahtodanan.sch.id/wp-json/wp/v2/posts` — harus
muncul data JSON. Kalau tidak, cek plugin keamanan yang mungkin memblokirnya.

## 2. Deploy ke Cloudflare Pages lewat GitHub

1. Push/upload semua file di paket ini ke repo GitHub (termasuk folder `functions/`)
2. Cloudflare Pages → **Connect to Git** → pilih repo → Build command kosong,
   Build output directory `/`
3. Deploy

**Wajib lewat GitHub atau Wrangler CLI** — upload langsung ("Upload assets")
di dashboard TIDAK mendukung folder `functions/`.

## 3. (Opsional, tapi disarankan) Aktifkan penyimpanan posisi foto bersama

Fitur "atur posisi foto" (lihat bagian bawah) bisa disimpan dengan dua cara:
- **Tanpa setup apa pun**: posisi tersimpan di perangkat itu SAJA (kalau Anda
  edit di HP, TV lobi tidak ikut berubah).
- **Dengan KV (disarankan)**: posisi tersimpan di server, otomatis tampil
  sama di semua perangkat begitu diedit sekali.

Cara mengaktifkan KV:
1. Cloudflare dashboard → **Workers & Pages** → **KV** → **Create a namespace**,
   beri nama misalnya `muhada-slider-positions`
2. Buka project Pages Anda → **Settings** → **Functions** → **KV namespace bindings**
   → **Add binding**
3. Variable name: `POSITIONS` (harus persis ini, huruf besar semua)
   Namespace: pilih `muhada-slider-positions` yang baru dibuat
4. Save — Cloudflare akan otomatis redeploy

Tanpa langkah ini, aplikasi tetap berjalan normal, cuma posisi fotonya jadi
per-perangkat saja.

## 4. Pasang di TV lobi / install ke HP-tablet-komputer

Sama seperti sebelumnya — buka URL `*.pages.dev` (atau domain sekolah kalau
sudah diatur custom domain), lalu:
- TV: `chrome --kiosk <url>`
- HP/tablet/desktop: menu browser → "Tambahkan ke layar Utama" / ikon install

## Fitur

- **20 artikel terbaru**, tiap artikel bisa punya sampai 5 foto (foto utama +
  foto di isi artikel), berganti otomatis tiap 6 detik
- **Gambar unik** — foto yang sama tidak akan tampil dua kali walau dipakai
  di beberapa artikel
- **Jam & tanggal** di kanan atas, auto-update
- **QR code** di tiap slide — pakai LINK PENDEK buatan sendiri (`/r/<id>`,
  bukan URL artikel yang panjang) supaya kodenya renggang dan gampang
  di-scan dari jarak jauh (misal dari kursi tunggu di lobi)
- **Atur posisi foto secara manual** (pengganti fitur auto-crop yang lama —
  auto-crop dihapus karena hasilnya kadang tidak akurat)
- **Hapus foto** — buang foto tertentu dari slider tanpa perlu edit artikel
  di WordPress, bisa dipulihkan lagi kapan saja

## Cara pakai fitur "Atur posisi foto" dan "Hapus foto" (khusus admin)

1. **Tekan-tahan** tulisan "SMK Muhammadiyah Todanan" di kiri atas selama
   ±1 detik
2. Masukkan PIN — default: `1234` (**ganti ini!** — cari `editPin: '1234'`
   di `index.html` dan ganti dengan PIN Anda sendiri sebelum deploy)
3. Panel kecil muncul di kiri bawah → klik **"Atur posisi / hapus foto"**
4. **Geser foto** (drag pakai jari di HP/tablet, atau klik-tarik pakai mouse
   di desktop) sampai komposisinya pas, lalu klik **Simpan** — posisi ini
   otomatis dipisah untuk kategori "HP" atau "Desktop/Tablet" tergantung
   perangkat yang sedang Anda pakai saat menyimpan (lebar layar di bawah
   768px dianggap HP)
5. Kalau foto itu memang tidak ingin ditampilkan sama sekali, klik
   **🗑 Hapus foto ini** — akan ada konfirmasi dulu sebelum benar-benar dihapus
6. Pakai tombol **◀ Sebelumnya / Berikutnya ▶** di toolbar untuk pindah ke
   foto lain tanpa keluar dari mode edit
7. Klik **Selesai** untuk kembali ke slideshow normal

Catatan: kalau KV belum diaktifkan (lihat bagian 3 di atas), posisi dan
foto yang dihapus cuma berlaku di perangkat itu saja — untuk berlaku di
semua perangkat, aktifkan KV dulu. Posisi foto dan foto yang dihapus
memakai KV/binding yang SAMA (`POSITIONS`) — tidak perlu setup terpisah.

## Cara memulihkan foto yang sudah dihapus

Di panel admin (tekan-tahan logo + PIN), ada baris yang menunjukkan jumlah
foto yang sedang disembunyikan/dihapus, dengan tombol **"Pulihkan semua foto
tersembunyi"** — ini akan mengembalikan SEMUA foto yang pernah dihapus
sekaligus (belum ada cara memulihkan satu-satu secara terpisah).

## Cara menyembunyikan QR code

Di panel admin yang sama (tekan-tahan logo + PIN), ada checkbox
**"Tampilkan kode QR di layar ini"** — matikan untuk menyembunyikan QR di
perangkat/layar itu. Ini pengaturan per-perangkat (localStorage), jadi bisa
beda-beda: misalnya QR ditampilkan di TV lobi tapi disembunyikan di HP.

## Pengaturan lain (di bagian atas `index.html`, objek `CONFIG`)

- `imageDurationMs` — lama tampil tiap foto (default 6000 = 6 detik)
- `maxImagesPerArticle` — maksimal foto per artikel (default 5)
- `mobileBreakpoint` — lebar layar (px) pembeda kategori HP vs Desktop (default 768)
- `editPin` — PIN untuk membuka panel admin — **wajib diganti dari default**
- `refreshDataEveryMs` — seberapa sering data artikel disegarkan (default 15 menit)
