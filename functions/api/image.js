// Proxy gambar dari WordPress, sekaligus menambahkan header CORS supaya
// gambar bisa dianalisis lewat <canvas> di browser (untuk deteksi titik
// fokus otomatis / smart-crop) tanpa kena blokir keamanan origin.
// Dipanggil sebagai: /api/image?url=<url gambar asli, sudah di-encode>

const ALLOWED_HOST = 'smkmuhammadiyahtodanan.sch.id';

// Beberapa plugin (mis. Jetpack) menyajikan gambar lewat CDN sendiri,
// bukan langsung dari domain website — izinkan pola yang umum dipakai.
const ALLOWED_EXTRA_SUFFIXES = ['.wp.com', '.wordpress.com'];

function isHostAllowed(hostname){
  if (hostname === ALLOWED_HOST || hostname.endsWith('.' + ALLOWED_HOST)) return true;
  return ALLOWED_EXTRA_SUFFIXES.some(suf => hostname.endsWith(suf));
}

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

  if (!isHostAllowed(parsed.hostname)) {
    return new Response('Domain gambar tidak diizinkan', { status: 403 });
  }

  try {
    const upstream = await fetch(target, {
      cf: { cacheTtl: 86400, cacheEverything: true },
      headers: {
        // Meniru permintaan wajar dari browser di situs sendiri, supaya
        // tidak kena proteksi hotlink di server WordPress.
        'Referer': 'https://' + ALLOWED_HOST + '/',
        'User-Agent': 'Mozilla/5.0 (compatible; MuhadaBerdayaSliderProxy/1.0)'
      }
    });

    if (!upstream.ok) {
      return new Response('Gagal mengambil gambar dari sumber (HTTP ' + upstream.status + ')', { status: 502 });
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
