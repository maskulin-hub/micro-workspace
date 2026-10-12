// script.js (Menggunakan Firebase Firestore V9)

// 1. Mengimpor Modul Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 2. Konfigurasi Firebase (Dari gambar Anda)
const firebaseConfig = {
  apiKey: "AIzaSyAsa3IjSoLRxQ8vVOSQ3r57pTaQn4e_EmI",
  authDomain: "micro-workspace-db.firebaseapp.com",
  projectId: "micro-workspace-db",
  storageBucket: "micro-workspace-db.firebasestorage.app",
  messagingSenderId: "320706948630",
  appId: "1:320706948630:web:5c1bf367f220e621730f37",
};

// 3. Inisialisasi Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variabel Global
let userAktif = null;
let unsubscribe = null; // Untuk menghentikan sinkronisasi jika logout

// Elemen DOM (Sama seperti sebelumnya)
const layarLogin = document.getElementById("layarLogin");
const inputUsername = document.getElementById("inputUsername");
const inputPassword = document.getElementById("inputPassword");
const btnMasuk = document.getElementById("btnMasuk");
const layarDashboard = document.getElementById("layarDashboard");
const namaTampil = document.getElementById("namaTampil");
const sapaanUser = document.getElementById("sapaanUser");
const btnKeluar = document.getElementById("btnKeluar");

const navDashboard = document.getElementById("navDashboard");
const navTasks = document.getElementById("navTasks");
const navCalendar = document.getElementById("navCalendar");
const halamanDashboard = document.getElementById("halamanDashboard");
const halamanTasks = document.getElementById("halamanTasks");
const halamanCalendar = document.getElementById("halamanCalendar");

const kotakTugas = document.getElementById("kotakTugas");
const kotakTanggal = document.getElementById("kotakTanggal");
const tombolTambah = document.getElementById("tombolTambah");
const daftarTugas = document.getElementById("daftarTugas");
const daftarKalender = document.getElementById("daftarKalender");

const angkaTotal = document.getElementById("angkaTotal");
const angkaSelesai = document.getElementById("angkaSelesai");
const angkaPending = document.getElementById("angkaPending");

// ---------------------------------------------------------
// LOGIKA LOGIN DENGAN FIRESTORE
// ---------------------------------------------------------
btnMasuk.addEventListener("click", async function () {
  const username = inputUsername.value.trim().toLowerCase();
  const password = inputPassword.value.trim();

  if (username === "" || password === "") {
    alert("Username dan Password tidak boleh kosong!");
    return;
  }

  btnMasuk.disabled = true;
  btnMasuk.textContent = "Loading...";

  try {
    const docRef = doc(db, "users", username);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Buat akun baru di Firestore
      await setDoc(docRef, {
        password: password,
        tasks: [],
      });
      alert(`Akun baru untuk "${username}" berhasil dibuat!`);
    } else {
      // Cek password
      const dataUser = docSnap.data();
      if (dataUser.password !== password) {
        alert("Akses Ditolak: Password salah!");
        btnMasuk.disabled = false;
        btnMasuk.innerHTML = 'Sign In <i class="fa-solid fa-arrow-right"></i>';
        return;
      }
    }

    userAktif = username;
    masukKeAplikasi(username);
  } catch (error) {
    console.error("Error saat login:", error);
    alert("Gagal terhubung ke database. Cek koneksi Anda.");
    btnMasuk.disabled = false;
    btnMasuk.innerHTML = 'Sign In <i class="fa-solid fa-arrow-right"></i>';
  }
});

inputPassword.addEventListener("keypress", (e) => {
  if (e.key === "Enter") btnMasuk.click();
});

function masukKeAplikasi(username) {
  layarLogin.classList.add("sembunyi");
  layarDashboard.classList.remove("sembunyi");

  const namaKapital = username.charAt(0).toUpperCase() + username.slice(1);
  namaTampil.textContent = namaKapital;

  // Logika Sapaan Dinamis Berdasarkan Waktu
  const jamSekarang = new Date().getHours();
  let ucapanWaktu = "Good Morning";

  if (jamSekarang >= 12 && jamSekarang < 18) {
    ucapanWaktu = "Good Afternoon"; // Jam 12.00 - 17.59
  } else if (jamSekarang >= 18 || jamSekarang < 5) {
    ucapanWaktu = "Good Evening"; // Jam 18.00 - 04.59
  }

  sapaanUser.textContent = `${ucapanWaktu}, ${namaKapital}!`;

  inputUsername.value = "";
  inputPassword.value = "";
  btnMasuk.disabled = false;
  btnMasuk.innerHTML = 'Sign In <i class="fa-solid fa-arrow-right"></i>';

  pindahHalaman(navDashboard, halamanDashboard);

  // Mulai membaca data secara real-time dari Firestore
  mulaiSinkronisasi(username);
}

btnKeluar.addEventListener("click", () => {
  if (unsubscribe) unsubscribe(); // Hentikan sinkronisasi database
  window.location.reload();
});

// ---------------------------------------------------------
// NAVIGASI MENU (Sama)
// ---------------------------------------------------------
function pindahHalaman(menuAktif, halamanTampil) {
  navDashboard.classList.remove("aktif");
  navTasks.classList.remove("aktif");
  navCalendar.classList.remove("aktif");

  halamanDashboard.classList.add("sembunyi");
  halamanTasks.classList.add("sembunyi");
  halamanCalendar.classList.add("sembunyi");

  menuAktif.classList.add("aktif");
  halamanTampil.classList.remove("sembunyi");
}

navDashboard.addEventListener("click", () =>
  pindahHalaman(navDashboard, halamanDashboard),
);
navTasks.addEventListener("click", () => pindahHalaman(navTasks, halamanTasks));
navCalendar.addEventListener("click", () =>
  pindahHalaman(navCalendar, halamanCalendar),
);

// ---------------------------------------------------------
// LOGIKA DATABASE FIRESTORE REAL-TIME
// ---------------------------------------------------------
function mulaiSinkronisasi(username) {
  const docRef = doc(db, "users", username);

  // onSnapshot akan bereaksi otomatis jika ada perubahan di database
  unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const dataUser = docSnap.data();
        perbaruiSemuaLayar(dataUser.tasks);
      }
    },
    (error) => {
      console.error("Error mendengarkan perubahan:", error);
    },
  );
}

function perbaruiSemuaLayar(tasksArr) {
  tampilkanDiTasks(tasksArr);
  tampilkanDiKalender(tasksArr);
  updateStatistik(tasksArr);
}

// ---------------------------------------------------------
// LOGIKA TAMBAH, UBAH, HAPUS TUGAS
// ---------------------------------------------------------
tombolTambah.addEventListener("click", async function () {
  const teksBaru = kotakTugas.value.trim();
  const tglBaru = kotakTanggal.value;

  if (teksBaru !== "" && userAktif) {
    try {
      const docRef = doc(db, "users", userAktif);
      const docSnap = await getDoc(docRef);
      let currentTasks = docSnap.data().tasks || [];

      currentTasks.push({
        teks: teksBaru,
        selesai: false,
        deadline: tglBaru,
      });

      await updateDoc(docRef, { tasks: currentTasks });

      kotakTugas.value = "";
      kotakTanggal.value = "";
    } catch (error) {
      console.error("Error tambah tugas:", error);
    }
  }
});

kotakTugas.addEventListener("keypress", (e) => {
  if (e.key === "Enter") tombolTambah.click();
});

// Karena onSnapshot mengambil alih rendering, kita harus
// membuat fungsi global di objek window agar dipanggil dari inline HTML
window.ubahStatus = async function (index) {
  if (!userAktif) return;
  try {
    const docRef = doc(db, "users", userAktif);
    const docSnap = await getDoc(docRef);
    let currentTasks = docSnap.data().tasks;

    currentTasks[index].selesai = !currentTasks[index].selesai;
    await updateDoc(docRef, { tasks: currentTasks });
  } catch (error) {
    console.error("Error ubah status:", error);
  }
};

window.hapusTugas = async function (index) {
  if (!userAktif) return;
  try {
    const docRef = doc(db, "users", userAktif);
    const docSnap = await getDoc(docRef);
    let currentTasks = docSnap.data().tasks;

    currentTasks.splice(index, 1);
    await updateDoc(docRef, { tasks: currentTasks });
  } catch (error) {
    console.error("Error hapus tugas:", error);
  }
};

// ---------------------------------------------------------
// RENDER HTML (Sama seperti versi sebelumnya)
// ---------------------------------------------------------
function buatElemenListHTML(tugas, index) {
  let htmlTanggal = "";
  if (tugas.deadline) {
    const tglObjek = new Date(tugas.deadline);
    const teksTgl = tglObjek.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0);
    let kelasBadge = "tgl-aman";
    if (tglObjek < hariIni && !tugas.selesai) {
      kelasBadge = "tgl-lewat";
    }

    htmlTanggal = `<span class="label-tanggal ${kelasBadge}"><i class="fa-regular fa-clock"></i> DL: ${teksTgl}</span>`;
  }
  return `
        <li class="item-tugas ${tugas.selesai ? "tugas-selesai" : ""}">
            <div class="info-tugas">
                <span class="teks-tugas">${tugas.teks}</span>
                ${htmlTanggal}
            </div>
            <div class="area-tombol">
                <button class="btn-selesai" onclick="window.ubahStatus(${index})"><i class="fa-solid fa-circle-check"></i></button>
                <button class="btn-hapus" onclick="window.hapusTugas(${index})"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        </li>
    `;
}

function tampilkanDiTasks(tasksArr) {
  daftarTugas.innerHTML = "";
  tasksArr.forEach((tugas, index) => {
    daftarTugas.innerHTML += buatElemenListHTML(tugas, index);
  });
}

function tampilkanDiKalender(tasksArr) {
  daftarKalender.innerHTML = "";
  let tugasDenganDL = tasksArr.map((tugas, index) => ({
    ...tugas,
    indexAsli: index,
  }));

  tugasDenganDL = tugasDenganDL.filter(
    (tugas) => tugas.deadline !== "" && !tugas.selesai,
  );
  tugasDenganDL.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  if (tugasDenganDL.length === 0) {
    daftarKalender.innerHTML =
      '<p style="color:#999; text-align:center; padding:20px;">Tidak ada tugas dengan deadline.</p>';
    return;
  }

  tugasDenganDL.forEach((tugas) => {
    daftarKalender.innerHTML += buatElemenListHTML(tugas, tugas.indexAsli);
  });
}

function updateStatistik(tasksArr) {
  let total = tasksArr.length;
  let selesai = tasksArr.filter((t) => t.selesai === true).length;
  let pending = total - selesai;

  angkaTotal.textContent = total;
  angkaSelesai.textContent = selesai;
  angkaPending.textContent = pending;
}
