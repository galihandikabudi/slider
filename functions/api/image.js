// Proxy gambar dari WordPress, sekaligus menambahkan header CORS.
// Dipanggil sebagai: /api/image?url=<url gambar asli, sudah di-encode>

const ALLOWED_HOST = 'smkmuhammadiyahtodanan.sch.id';

// Beberapa plugin (mis. Jetpack) menyajikan gambar lewat CDN sendiri,
// bukan langsung dari domain website — izinkan pola yang umum dipakai.
const ALLOWED_EXTRA_SUFFIXES = ['.wp.com', '.wordpress.com'];

function isHostAllowed(hostname){
  if (hostname === ALLOWED_HOST || hostname.endsWith('.' + ALLOWED_HOST)) return true;
  return ALLOWED_EXTRA_SUFFIXES.some(suf => hostname.endsWith(suf));
}

async function tryFetch(target, withSpoofedHeaders){
  const headers = withSpoofedHeaders
    ? {
        'Referer': 'https://' + ALLOWED_HOST + '/',
        'User-Agent': 'Mozilla/5.0 (compatible; MuhadaBerdayaSliderProxy/1.0)'
      }
    : {}; // sebagian server justru curiga pada Referer/User-Agent custom — coba tanpa itu sebagai percobaan kedua

  const res = await fetch(target, {
    cf: { cacheTtl: 86400, cacheEverything: true },
    headers
  });

  const contentType = res.headers.get('Content-Type') || '';
  // Sebagian server balas HTTP 200 tapi isinya halaman error HTML (bukan
  // gambar) — itu tetap harus dianggap gagal, bukan cuma cek status code.
  if (!res.ok || !contentType.startsWith('image/')) {
    return { ok: false, status: res.status, contentType };
  }
  return { ok: true, response: res };
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
    let result = await tryFetch(target, true);
    if (!result.ok) {
      result = await tryFetch(target, false); // percobaan kedua, tanpa header spoofing
    }

    if (!result.ok) {
      return new Response(
        'Gagal mengambil gambar dari sumber (HTTP ' + result.status + ', content-type: ' + result.contentType + ')',
        { status: 502 }
      );
    }

    return new Response(result.response.body, {
      status: 200,
      headers: {
        'Content-Type': result.response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response('Gagal memproses gambar: ' + String(err), { status: 502 });
  }
}
