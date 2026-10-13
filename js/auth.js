import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const ADMIN_USERNAME = "superadminpnl";
const ADMIN_PASSWORD = "superpasswordadmin";
const ADMIN_WA = "082296275318"; // Nomor dosen Anda

// ===== LOGIN USER =====
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const whatsapp = document.getElementById("whatsapp").value.trim();
  const isAdmin = document.getElementById("isAdmin").checked;

  // Jika user centang "Login sebagai Admin"
  if (isAdmin) {
    alert("Silakan gunakan tombol 'Login Khusus Admin' di bawah.");
    return;
  }

  try {
    // Coba login
    let userCred;
    try {
      userCred = await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      // Jika gagal → daftar akun baru
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Simpan data user baru
        await setDoc(doc(db, "users", userCred.user.uid), {
          email,
          whatsapp,
          role: "mahasiswa",
          verified: false,
          createdAt: serverTimestamp()
        });
      } else {
        throw err;
      }
    }

    // Cek status verifikasi user
    const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
    const userData = userDoc.data();

    if (!userData.verified) {
      // Kirim notif WA ke dosen
      await kirimNotifKeDosen(userData, userCred.user.uid);
      // Arahkan ke halaman verifikasi
      localStorage.setItem("pendingUid", userCred.user.uid);
      localStorage.setItem("pendingWa", whatsapp);
      window.location.href = "verifikasi.html";
    } else {
      // Sudah terverifikasi → langsung ke home
      window.location.href = "home.html";
    }

  } catch (err) {
    alert("Error: " + err.message);
  }
});

// ===== KIRIM NOTIF WA KE DOSEN =====
async function kirimNotifKeDosen(userData, uid) {
  const pesan = `🔔 *LABPIN - Permintaan Verifikasi*\n\n` +
    `Ada mahasiswa yang ingin mendaftar:\n` +
    `📧 Email: ${userData.email}\n` +
    `📱 WA: ${userData.whatsapp}\n` +
    `🆔 UID: ${uid}\n\n` +
    `Silakan buka dashboard admin untuk ACC/Decline:\n` +
    `https://labpin-anda.netlify.app/admin.html`;

  await fetch("/.netlify/functions/send-wa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: ADMIN_WA, message: pesan })
  });
}

// ===== LOGIN ADMIN =====
document.getElementById("adminBtn").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("adminModal").classList.remove("hidden");
});

document.getElementById("adminCloseBtn").addEventListener("click", () => {
  document.getElementById("adminModal").classList.add("hidden");
});

document.getElementById("adminLoginBtn").addEventListener("click", () => {
  const u = document.getElementById("adminUser").value;
  const p = document.getElementById("adminPass").value;

  if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) {
    localStorage.setItem("isAdmin", "true");
    window.location.href = "admin.html";
  } else {
    alert("Username atau password admin salah!");
  }
});