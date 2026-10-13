import { db, auth } from "./firebase-config.js";
import {
  collection, getDocs, doc, getDoc, addDoc, query, where, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let currentUser = null;
let selectedAlat = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  currentUser = user;
  document.getElementById("userEmail").textContent = user.email;
  await loadAlat();
  loadPeminjamanAktif();
});

// ===== LOAD DAFTAR ALAT =====
async function loadAlat() {
  const snap = await getDocs(collection(db, "alat"));
  const grid = document.getElementById("alatGrid");
  grid.innerHTML = "";

  let total = 0, tersedia = 0, dipinjam = 0, rusak = 0;

  snap.forEach((d) => {
    const alat = d.data();
    total++;
    if (alat.status === "tersedia") tersedia++;
    else if (alat.status === "dipinjam") dipinjam++;
    else if (alat.status === "rusak") rusak++;

    const card = document.createElement("div");
    card.className = "alat-card";
    card.innerHTML = `
      <img src="assets/images/alat/${alat.gambar || 'default.jpg'}" 
           alt="${alat.nama}" onerror="this.src='assets/images/alat/default.jpg'">
      <div class="alat-info">
        <h3>${alat.nama}</h3>
        <p class="kode">${alat.kode}</p>
        <p>${alat.deskripsi || ''}</p>
        <span class="badge ${alat.status}">${alat.status}</span>
        ${alat.note ? `<p class="note">📝 ${alat.note}</p>` : ''}
      </div>
      <button class="btn-pinjam" ${alat.status !== 'tersedia' ? 'disabled' : ''}>
        ${alat.status === 'tersedia' ? 'Pinjam' : 'Tidak Tersedia'}
      </button>
    `;
    card.querySelector(".btn-pinjam").onclick = () => openModal(d.id, alat);
    grid.appendChild(card);
  });

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statTersedia").textContent = tersedia;
  document.getElementById("statDipinjam").textContent = dipinjam;
  document.getElementById("statRusak").textContent = rusak;
}

// ===== SEARCH =====
document.getElementById("searchInput").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll(".alat-card").forEach((card) => {
    card.style.display = card.textContent.toLowerCase().includes(q) ? "" : "none";
  });
});

// ===== MODAL PINJAM =====
function openModal(alatId, alat) {
  selectedAlat = { id: alatId, ...alat };
  document.getElementById("modalAlatNama").textContent = alat.nama;
  document.getElementById("modalPinjam").classList.remove("hidden");
}

document.getElementById("btnPinjamCancel").onclick = () => {
  document.getElementById("modalPinjam").classList.add("hidden");
};

document.getElementById("btnPinjamConfirm").onclick = async () => {
  const tglPinjam = document.getElementById("tglPinjam").value;
  const jamPinjam = document.getElementById("jamPinjam").value;
  const tglKembali = document.getElementById("tglKembali").value;
  const jamKembali = document.getElementById("jamKembali").value;
  const keterangan = document.getElementById("keterangan").value;

  if (!tglPinjam || !jamPinjam || !tglKembali || !jamKembali) {
    alert("Lengkapi tanggal dan jam!");
    return;
  }

  await addDoc(collection(db, "peminjaman"), {
    userId: currentUser.uid,
    userEmail: currentUser.email,
    alatId: selectedAlat.id,
    alatNama: selectedAlat.nama,
    tglPinjam, jamPinjam, tglKembali, jamKembali, keterangan,
    status: "diajukan",
    createdAt: serverTimestamp()
  });

  alert("✅ Peminjaman diajukan! Menunggu persetujuan admin.");
  document.getElementById("modalPinjam").classList.add("hidden");
};

// ===== LOAD PEMINJAMAN AKTIF =====
function loadPeminjamanAktif() {
  const q = query(collection(db, "peminjaman"), where("userId", "==", currentUser.uid));
  onSnapshot(q, (snap) => {
    const list = document.getElementById("peminjamanAktif");
    list.innerHTML = "";
    if (snap.empty) {
      list.innerHTML = "<p style='color:#888'>Belum ada peminjaman.</p>";
      return;
    }
    snap.forEach((d) => {
      const p = d.data();
      const div = document.createElement("div");
      div.className = "peminjaman-item";
      div.innerHTML = `
        <strong>${p.alatNama}</strong>
        <span class="badge ${p.status}">${p.status}</span>
        <small>${p.tglPinjam} ${p.jamPinjam} → ${p.tglKembali} ${p.jamKembali}</small>
      `;
      list.appendChild(div);
    });
  });
}

document.getElementById("logoutBtn").onclick = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};