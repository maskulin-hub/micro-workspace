// Menggunakan V3 agar memori yang error/rusak sebelumnya ter-reset otomatis
let userAktif = null;
let databaseMicro = JSON.parse(localStorage.getItem("databaseMicroV3")) || {};

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

// LOGIKA LOGIN
btnMasuk.addEventListener("click", function () {
  const username = inputUsername.value.trim().toLowerCase();
  const password = inputPassword.value.trim();

  if (username === "" || password === "") {
    alert("Username dan Password tidak boleh kosong!");
    return;
  }

  if (!databaseMicro[username]) {
    databaseMicro[username] = {
      password: password,
      tasks: [],
    };
    alert(`Akun baru untuk "${username}" berhasil dibuat!`);
  } else {
    if (databaseMicro[username].password !== password) {
      alert("Akses Ditolak: Password salah!");
      return;
    }
  }

  userAktif = username;
  layarLogin.classList.add("sembunyi");
  layarDashboard.classList.remove("sembunyi");

  const namaKapital = userAktif.charAt(0).toUpperCase() + userAktif.slice(1);
  namaTampil.textContent = namaKapital;
  sapaanUser.textContent = `Good Morning, ${namaKapital}!`;

  inputUsername.value = "";
  inputPassword.value = "";

  pindahHalaman(navDashboard, halamanDashboard);
  perbaruiSemuaLayar();
});

inputPassword.addEventListener("keypress", (e) => {
  if (e.key === "Enter") btnMasuk.click();
});
btnKeluar.addEventListener("click", () => {
  window.location.reload();
});

// NAVIGASI MENU
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

// LOGIKA APLIKASI & TUGAS
function perbaruiSemuaLayar() {
  tampilkanDiTasks();
  tampilkanDiKalender();
  updateStatistik();
}

tombolTambah.addEventListener("click", function () {
  const teksBaru = kotakTugas.value.trim();
  const tglBaru = kotakTanggal.value;

  if (teksBaru !== "") {
    databaseMicro[userAktif].tasks.push({
      teks: teksBaru,
      selesai: false,
      deadline: tglBaru,
    });
    simpanData();
    perbaruiSemuaLayar();
    kotakTugas.value = "";
    kotakTanggal.value = "";
  }
});

kotakTugas.addEventListener("keypress", (e) => {
  if (e.key === "Enter") tombolTambah.click();
});

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
                <button class="btn-selesai" onclick="ubahStatus(${index})"><i class="fa-solid fa-circle-check"></i></button>
                <button class="btn-hapus" onclick="hapusTugas(${index})"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        </li>
    `;
}

function tampilkanDiTasks() {
  daftarTugas.innerHTML = "";
  const tugasUserIni = databaseMicro[userAktif].tasks;
  tugasUserIni.forEach((tugas, index) => {
    daftarTugas.innerHTML += buatElemenListHTML(tugas, index);
  });
}

function tampilkanDiKalender() {
  daftarKalender.innerHTML = "";
  let tugasDenganDL = databaseMicro[userAktif].tasks.map((tugas, index) => ({
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

function updateStatistik() {
  const tugasUserIni = databaseMicro[userAktif].tasks;
  let total = tugasUserIni.length;
  let selesai = tugasUserIni.filter((t) => t.selesai === true).length;
  let pending = total - selesai;

  angkaTotal.textContent = total;
  angkaSelesai.textContent = selesai;
  angkaPending.textContent = pending;
}

function ubahStatus(index) {
  databaseMicro[userAktif].tasks[index].selesai =
    !databaseMicro[userAktif].tasks[index].selesai;
  simpanData();
  perbaruiSemuaLayar();
}

function hapusTugas(index) {
  databaseMicro[userAktif].tasks.splice(index, 1);
  simpanData();
  perbaruiSemuaLayar();
}

function simpanData() {
  // Simpan ke versi V3
  localStorage.setItem("databaseMicroV3", JSON.stringify(databaseMicro));
}
