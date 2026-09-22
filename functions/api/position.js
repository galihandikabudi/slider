// Menyimpan posisi foto yang diatur manual lewat mode edit di slider.
// Disimpan di Cloudflare KV supaya begitu diedit di satu perangkat,
// hasilnya ikut terlihat di semua perangkat lain (TV lobi, HP, tablet).
//
// Perlu satu langkah setup di dashboard Cloudflare (lihat README.md):
// buat KV namespace, lalu bind ke variabel bernama POSITIONS di
// Settings > Functions project Pages ini. Kalau belum di-bind, fitur ini
// otomatis "gagal dengan aman" — aplikasi tetap jalan, cuma penyimpanan
// posisinya jadi lokal per perangkat saja (lihat index.html).

const KV_KEY = 'positions';

export async function onRequestGet(context) {
  const kv = context.env.POSITIONS;
  if (!kv) {
    return new Response(JSON.stringify({ kvActive: false, data: {} }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }
  const raw = await kv.get(KV_KEY);
  let data = {};
  try{ data = raw ? JSON.parse(raw) : {}; }catch(e){ data = {}; }
  return new Response(JSON.stringify({ kvActive: true, data }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

export async function onRequestPost(context) {
  const kv = context.env.POSITIONS;
  if (!kv) {
    return new Response(
      JSON.stringify({ ok: false, error: 'KV belum diatur di project ini' }),
      { status: 501, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Body bukan JSON valid' }), { status: 400 });
  }

  let current = {};
  try {
    current = JSON.parse((await kv.get(KV_KEY)) || '{}');
  } catch (e) {
    current = {};
  }

  // Mode batch: simpan BANYAK foto sekaligus dalam satu request —
  // { batch: [{ imageUrl, device, position }, ...] }
  if (body && Array.isArray(body.batch)) {
    let saved = 0;
    for (const entry of body.batch) {
      const { imageUrl, device, position } = entry || {};
      if (!imageUrl || !device || !position || (device !== 'mobile' && device !== 'desktop')) continue;
      if (!current[imageUrl]) current[imageUrl] = {};
      current[imageUrl][device] = position;
      saved++;
    }
    if (saved === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'Tidak ada entri valid di dalam batch' }), { status: 400 });
    }
    await kv.put(KV_KEY, JSON.stringify(current));
    return new Response(JSON.stringify({ ok: true, saved }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Mode satu foto (tetap didukung untuk kompatibilitas).
  const { imageUrl, device, position } = body || {};
  if (!imageUrl || !device || !position || (device !== 'mobile' && device !== 'desktop')) {
    return new Response(JSON.stringify({ ok: false, error: 'Data tidak lengkap/valid' }), { status: 400 });
  }

  if (!current[imageUrl]) current[imageUrl] = {};
  current[imageUrl][device] = position;

  await kv.put(KV_KEY, JSON.stringify(current));

  return new Response(JSON.stringify({ ok: true, saved: 1 }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
