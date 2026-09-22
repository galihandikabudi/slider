// Cloudflare Pages Function — jalan di edge Cloudflare, bukan di browser.
// Endpoint frontend: /api/articles
// Tugasnya: ambil data dari WordPress REST API di sisi server (tidak kena
// aturan CORS browser), lalu teruskan ke slider dengan cache singkat di edge.

const WP_ENDPOINT =
  'https://smkmuhammadiyahtodanan.sch.id/wp-json/wp/v2/posts?per_page=20&_embed';

export async function onRequestGet(context) {
  try {
    const upstream = await fetch(WP_ENDPOINT, {
      cf: {
        // Simpan hasil di cache edge Cloudflare selama 10 menit supaya
        // website sekolah tidak dibebani permintaan berulang dari tiap
        // layar/HP yang menampilkan slider.
        cacheTtl: 600,
        cacheEverything: true
      },
      headers: { 'User-Agent': 'MuhadaBerdaya-SliderProxy/1.0' }
    });

    if (!upstream.ok) {
      return jsonResponse(
        { error: 'upstream_error', status: upstream.status },
        502
      );
    }

    const data = await upstream.text();
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=120, s-maxage=600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return jsonResponse(
      { error: 'fetch_failed', message: String(err) },
      502
    );
  }
}

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
