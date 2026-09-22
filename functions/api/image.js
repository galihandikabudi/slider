// Proxy gambar dari WordPress, sekaligus menambahkan header CORS supaya
// gambar bisa dianalisis lewat <canvas> di browser (untuk deteksi titik
// fokus otomatis / smart-crop) tanpa kena blokir keamanan origin.
// Dipanggil sebagai: /api/image?url=<url gambar asli, sudah di-encode>

const ALLOWED_HOST = 'smkmuhammadiyahtodanan.sch.id';

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const target = searchParams.get('url');

  if (!target) {
    return new Response('Parameter "url" wajib diisi', { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch (e) {
    return new Response('URL tidak valid', { status: 400 });
  }

  // Hanya izinkan gambar dari domain website sekolah sendiri, supaya proxy
  // ini tidak bisa disalahgunakan untuk mengambil gambar dari situs lain.
  if (parsed.hostname !== ALLOWED_HOST && !parsed.hostname.endsWith('.' + ALLOWED_HOST)) {
    return new Response('Domain gambar tidak diizinkan', { status: 403 });
  }

  try {
    const upstream = await fetch(target, {
      cf: { cacheTtl: 86400, cacheEverything: true }
    });

    if (!upstream.ok) {
      return new Response('Gagal mengambil gambar dari sumber', { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response('Gagal memproses gambar: ' + String(err), { status: 502 });
  }
}
