// Google Apps Script – penerima data Porsiku (seperti Google Form)
// Tempel di Extensions > Apps Script pada Google Sheet, lalu Deploy > Manage deployments > Edit > New version.
// Saat pertama dijalankan, izinkan akses Google Drive (dipakai untuk menyimpan foto bukti bayar).
const TOKEN = 'PORSIKU1234'; // samakan dengan CONFIG.TOKEN di script.js
const FOLDER = 'Bukti Bayar Porsiku';

const SHEETS = {
  pengguna: {
    nama: 'Data Pengguna',
    kolom: ['nama','jk','usia','bb','tb','aktivitas','alergi','imt','kategori','bmr','tee'],
    judul: ['Nama','Jenis kelamin','Usia','BB (kg)','TB (cm)','Aktivitas','Alergi','IMT','Kategori IMT','BMR (kkal)','Total energi (kkal)']
  },
  konsultasi: {
    nama: 'Konsultasi',
    kolom: ['kode','nama','jk','usia','bb','tb','aktivitas','alergi','imt','kategori','bmr','tee','menu','keluhan','_bukti'],
    judul: ['Kode','Nama','Jenis kelamin','Usia','BB (kg)','TB (cm)','Aktivitas','Alergi','IMT','Kategori IMT','BMR (kkal)','Total energi (kkal)','Menu dipilih','Keluhan','Bukti bayar']
  }
};

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  const cfg = SHEETS[d.tipe];
  if (d.token !== TOKEN || !cfg) return ContentService.createTextOutput('ditolak');

  // simpan foto bukti bayar ke Drive, ambil link-nya
  let link = '';
  if (d.tipe === 'konsultasi' && d.bukti) {
    const it = DriveApp.getFoldersByName(FOLDER);
    const folder = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER);
    const blob = Utilities.newBlob(Utilities.base64Decode(d.bukti), 'image/jpeg', (d.kode || 'bukti') + ' - ' + d.nama + '.jpg');
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    link = file.getUrl();
  }

  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(cfg.nama) || ss.insertSheet(cfg.nama);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Waktu', ...cfg.judul]);
    sh.getRange(1, 1, 1, cfg.judul.length + 1).setFontWeight('bold').setBackground('#dcebe8');
    sh.setFrozenRows(1);
  }
  sh.appendRow([new Date(), ...cfg.kolom.map(k => k === '_bukti' ? link : (d[k] === undefined ? '' : d[k]))]);
  lock.releaseLock();
  return ContentService.createTextOutput('ok');
}
