import { db, auth } from "./firebase-config.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const uid = localStorage.getItem("pendingUid");
const wa = localStorage.getItem("pendingWa");

document.getElementById("waUser").textContent = wa;

// Nomor kontak admin (ganti dengan nomor dosen Anda)
const ADMIN_CONTACT = "6282296275318";
document.getElementById("contactBtn").href = 
  `https://wa.me/${ADMIN_CONTACT}?text=Halo%20Admin,%20saya%20sudah%20mendaftar%20di%20LABPIN%20dan%20menunggu%20verifikasi.`;

// Dengarkan perubahan status user secara real-time
if (uid) {
  onSnapshot(doc(db, "users", uid), (snapshot) => {
    const data = snapshot.data();
    if (!data) return;

    if (data.verified) {
      document.getElementById("statusText").textContent = "✅ Akun Anda telah diverifikasi!";
      document.querySelector(".spinner").style.display = "none";
      setTimeout(() => window.location.href = "home.html", 1500);
    } else if (data.rejected) {
      document.getElementById("statusText").textContent = 
        "❌ Maaf, akun Anda tidak dapat diverifikasi.";
      document.querySelector(".spinner").style.display = "none";
      document.querySelector(".info p:last-of-type").innerHTML = 
        `Silakan hubungi nomor ini: <strong>0822-9627-5318</strong>`;
    }
  });
}