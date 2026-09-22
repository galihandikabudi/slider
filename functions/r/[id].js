// Link pendek untuk QR code. WordPress selalu bisa membuka artikel lewat
// pola universal "?p=<id>" terlepas dari permalink/slug aslinya, jadi kita
// tidak perlu menyimpan URL asli di mana pun — cukup redirect berdasarkan ID.
// Ini membuat QR code jauh lebih pendek & tidak terlalu padat modulnya
// dibanding memakai URL artikel yang panjang.

const WP_ORIGIN = 'https://smkmuhammadiyahtodanan.sch.id';

export async function onRequestGet(context) {
  const id = context.params.id;
  if (!/^\d+$/.test(String(id))) {
    return new Response('ID artikel tidak valid', { status: 400 });
  }
  const target = `${WP_ORIGIN}/?p=${id}`;
  return Response.redirect(target, 302);
}
