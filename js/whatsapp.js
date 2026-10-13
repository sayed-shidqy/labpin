// js/whatsapp.js
// Format pesan: PINJAM <KODE_ALAT> <TANGGAL> <JAM>

export function parseWhatsAppMessage(text) {
  // Contoh: "PINJAM ALAT001 07-10-2026 13:30"
  const regex = /^PINJAM\s+(\S+)\s+(\d{2}-\d{2}-\d{4})\s+(\d{2}:\d{2})$/i;
  const match = text.match(regex);
  if (!match) return null;
  return { kode: match[1], tanggal: match[2], jam: match[3] };
}

// Tombol "Pinjam via WhatsApp" di home.html
export function generateWALink(alatKode, noAdmin = "6282296275318") {
  const pesan = `PINJAM ${alatKode} ${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')} 13:30`;
  return `https://wa.me/${noAdmin}?text=${encodeURIComponent(pesan)}`;
}