// Menyimpan daftar URL foto yang "dihapus" (disembunyikan permanen) dari
// slider lewat mode edit. Pakai KV yang SAMA dengan posisi foto manual
// (binding POSITIONS) — tidak perlu setup KV terpisah kalau sudah pernah
// mengaktifkan fitur atur posisi foto.

const KV_KEY = 'hiddenImages';

export async function onRequestGet(context) {
  const kv = context.env.POSITIONS;
  if (!kv) {
    return new Response(JSON.stringify({ kvActive: false, hidden: {} }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }
  const raw = await kv.get(KV_KEY);
  let hidden = {};
  try{ hidden = raw ? JSON.parse(raw) : {}; }catch(e){ hidden = {}; }
  return new Response(JSON.stringify({ kvActive: true, hidden }), {
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

  if (body && body.clearAll === true) {
    // Pulihkan semua foto yang sebelumnya disembunyikan.
    current = {};
  } else {
    const { imageUrl, hidden } = body || {};
    if (!imageUrl || typeof hidden !== 'boolean') {
      return new Response(JSON.stringify({ ok: false, error: 'Data tidak lengkap/valid' }), { status: 400 });
    }
    if (hidden) current[imageUrl] = true;
    else delete current[imageUrl];
  }

  await kv.put(KV_KEY, JSON.stringify(current));

  return new Response(JSON.stringify({ ok: true, hidden: current }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
