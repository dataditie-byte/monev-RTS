# Monev RTS Dit IE 2026 — Frontend v1.3

Frontend GitHub Pages untuk Sistem Monitoring Remaja Teman Sebaya (RTS) Dit IE BNN T.A. 2026.

## Perubahan v1.3
- Header/banner diperkecil dan tidak lagi dipaksa `min-height:360px`.
- Pilihan GURU/SISWA menggunakan state JavaScript sebagai sumber kebenaran tunggal.
- Pilihan aktif ditampilkan jelas sebelum tombol Mulai Pengisian.
- Alur Mulai Pengisian divalidasi dengan `getQuestions` terlebih dahulu, lalu `createSession`.
- Payload API mengirim `jenis_responden` dan `kelompok` pada level utama serta salinan `data`/`payload` untuk kompatibilitas router Apps Script.
- Timeout API 25 detik dan pesan error dibuat lebih jelas.
- Tidak ada API key Gemini di frontend.
- Backend Apps Script production tidak diubah oleh repo ini.

## Struktur
- `index.html` — seluruh UI dan logika frontend.
- `assets/` — logo BNN, Ananda Bersinar, dan header War On Drugs for Humanity.
- `_config.yml` — konfigurasi GitHub Pages.
- `.gitignore` — pengecualian file lokal.

## API Backend
URL Apps Script production sudah diatur di `index.html` pada `API_URL`.

## Deploy
1. Upload/replace seluruh isi repo dengan isi folder ini.
2. Pastikan GitHub Pages memakai branch/folder yang benar.
3. Setelah deploy, lakukan hard refresh `Ctrl + F5`.
4. Footer harus menampilkan `Frontend v1.3`.
5. Pilih Guru atau Siswa sampai muncul `Pilihan aktif: ...`.
6. Klik `Mulai Pengisian`.

> Backend `Code.gs`, Spreadsheet, Drive, Queue AI, dan Gemini tetap berada di Apps Script dan tidak disentuh oleh frontend ini.
