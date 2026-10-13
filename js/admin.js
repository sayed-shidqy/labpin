import { db } from "./firebase-config.js";
import {
  collection, getDocs, doc, updateDoc, deleteDoc, addDoc, setDoc,
  onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Cek login admin
if (localStorage.getItem("isAdmin") !== "true") {
  window.location.href = "index.html";
}

document.getElementById("logoutAdmin").onclick = () => {
  localStorage.removeItem("isAdmin");
  window.location.href = "index.html";
};

// ===== 1. LIST USER YANG BELUM DIVERIFIKASI =====
onSnapshot(collection(db, "users"), (snap) => {
  const list = document.getElementById("verifikasiList");
  list.innerHTML = "";

  snap.forEach((d) => {
    const u = d.data();
    if (u.verified || u.rejected) return;

    const div = document.createElement("div");
    div.className = "verif-item";
    div.innerHTML = `
      <div>
        <strong>${u.email}</strong><br>
        <small>📱 ${u.whatsapp}</small>
      </div>
      <div class="verif-actions">
        <button class="btn-accept">✅ Accept</button>
        <button class="btn-reject">❌ Decline</button>
      </div>
    `;

    div.querySelector(".btn-accept").onclick = async () => {
      await updateDoc(doc(db, "users", d.id), { verified: true, rejected: false });
      await kirimWA(u.whatsapp, 
        `✅ *LABPIN - Akun Terverifikasi*\n\nAkun Anda telah diverifikasi. Silakan login kembali di website LABPIN.`);
      alert("User diverifikasi!");
    };

    div.querySelector(".btn-reject").onclick = async () => {
      await updateDoc(doc(db, "users", d.id), { verified: false, rejected: true });
      await kirimWA(u.whatsapp,
        `❌ *LABPIN - Verifikasi Ditolak*\n\nMaaf, akun Anda tidak dapat diverifikasi. Silakan hubungi: 0822-9627-5318`);
      alert("User ditolak.");
    };

    list.appendChild(div);
  });

  if (list.innerHTML === "") {
    list.innerHTML = "<p style='color:#888'>Tidak ada permintaan verifikasi.</p>";
  }
});

// ===== 2. KELOLA ALAT =====
onSnapshot(collection(db, "alat"), (snap) => {
  const list = document.getElementById("adminAlatList");
  list.innerHTML = "";
  snap.forEach((d) => {
    const a = d.data();
    const div = document.createElement("div");
    div.className = "admin-alat-item";
    div.innerHTML = `
      <img src="assets/images/alat/${a.gambar || 'default.jpg'}" onerror="this.src='assets/images/alat/default.jpg'">
      <div class="alat-detail">
        <strong>${a.nama}</strong> <small>(${a.kode})</small><br>
        <span class="badge ${a.status}">${a.status}</span>
        <span>Jumlah: ${a.jumlah}</span>
        ${a.note ? `<p class="note">📝 ${a.note}</p>` : ''}
      </div>
      <div class="alat-actions">
        <button class="btn-edit">✏️ Edit</button>
        <button class="btn-hapus">🗑️ Hapus</button>
      </div>
    `;
    div.querySelector(".btn-edit").onclick = () => openAlatModal(d.id, a);
    div.querySelector(".btn-hapus").onclick = async () => {
      if (confirm(`Hapus ${a.nama}?`)) await deleteDoc(doc(db, "alat", d.id));
    };
    list.appendChild(div);
  });
});

// ===== 3. PEMINJAMAN =====
onSnapshot(collection(db, "peminjaman"), (snap) => {
  const list = document.getElementById("peminjamanList");
  list.innerHTML = "";
  snap.forEach((d) => {
    const p = d.data();
    const div = document.createElement("div");
    div.className = "peminjaman-admin-item";
    div.innerHTML = `
      <div>
        <strong>${p.userEmail}</strong> meminjam <strong>${p.alatNama}</strong><br>
        <small>${p.tglPinjam} ${p.jamPinjam} → ${p.tglKembali} ${p.jamKembali}</small><br>
        <span class="badge ${p.status}">${p.status}</span>
      </div>
      <div class="peminjaman-actions">
        ${p.status === 'diajukan' ? 
          `<button class="btn-accept">Setujui</button>
           <button class="btn-reject">Tolak</button>` : ''}
        ${p.status === 'dipinjam' ? 
          `<button class="btn-kembali">Tandai Kembali</button>` : ''}
      </div>
    `;

    const accept = div.querySelector(".btn-accept");
    const reject = div.querySelector(".btn-reject");
    const kembali = div.querySelector(".btn-kembali");

    if (accept) accept.onclick = async () => {
      await updateDoc(doc(db, "peminjaman", d.id), { status: "dipinjam" });
      await updateDoc(doc(db, "alat", p.alatId), { status: "dipinjam" });
    };
    if (reject) reject.onclick = async () => {
      await updateDoc(doc(db, "peminjaman", d.id), { status: "ditolak" });
    };
    if (kembali) kembali.onclick = async () => {
      await updateDoc(doc(db, "peminjaman", d.id), { status: "dikembalikan" });
      await updateDoc(doc(db, "alat", p.alatId), { status: "tersedia" });
    };

    list.appendChild(div);
  });
});

// ===== MODAL ALAT =====
const modal = document.getElementById("modalAlat");

document.getElementById("btnTambahAlat").onclick = () => {
  document.getElementById("modalAlatTitle").textContent = "Tambah Alat";
  ["alatId","alatKode","alatNama","alatKategori","alatJumlah","alatGambar","alatNote"]
    .forEach(id => document.getElementById(id).value = "");
  modal.classList.remove("hidden");
};

function openAlatModal(id, a) {
  document.getElementById("modalAlatTitle").textContent = "Edit Alat";
  document.getElementById("alatId").value = id;
  document.getElementById("alatKode").value = a.kode;
  document.getElementById("alatNama").value = a.nama;
  document.getElementById("alatKategori").value = a.kategori || "";
  document.getElementById("alatJumlah").value = a.jumlah;
  document.getElementById("alatStatus").value = a.status;
  document.getElementById("alatGambar").value = a.gambar || "";
  document.getElementById("alatNote").value = a.note || "";
  modal.classList.remove("hidden");
}

document.getElementById("btnBatalAlat").onclick = () => modal.classList.add("hidden");

document.getElementById("btnSimpanAlat").onclick = async () => {
  const id = document.getElementById("alatId").value;
  const data = {
    kode: document.getElementById("alatKode").value,
    nama: document.getElementById("alatNama").value,
    kategori: document.getElementById("alatKategori").value,
    jumlah: parseInt(document.getElementById("alatJumlah").value) || 0,
    status: document.getElementById("alatStatus").value,
    gambar: document.getElementById("alatGambar").value,
    note: document.getElementById("alatNote").value,
    updatedAt: serverTimestamp()
  };

  if (!data.kode || !data.nama) {
    alert("Kode dan nama wajib diisi!");
    return;
  }

  if (id) {
    await updateDoc(doc(db, "alat", id), data);
  } else {
    await addDoc(collection(db, "alat"), { ...data, createdAt: serverTimestamp() });
  }
  modal.classList.add("hidden");
};

// ===== FUNGSI KIRIM WA =====
async function kirimWA(target, message) {
  await fetch("/.netlify/functions/send-wa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, message })
  });
}