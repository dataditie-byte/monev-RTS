# Monev RTS Dit IE 2026 — Modul Analisis Final

Modul ini membaca data dari Spreadsheet yang sama dengan Form RTS. Tidak membuat sistem pengumpulan baru.

## Fitur
- Filter provinsi, kabupaten/kota, unit/satker, dan kelompok responden.
- KPI total pengisian, selesai, berjalan, jawaban, dan kelengkapan.
- Komposisi YA/TIDAK Guru Pendamping dan Siswa/Fasilitator.
- Analisis per pertanyaan dengan persentase dan contoh penjelasan.
- Tema yang muncul dari penjelasan teks.
- Daftar pengisian terbaru dan detail setiap responden.
- Membaca tabel ANALISIS jika sudah diisi oleh proses AI/analisis lain.
- Cetak halaman untuk bahan laporan.

## Pemasangan
1. Gunakan `Code.gs` ini sebagai lanjutan dari backend Browser-STT yang sekarang.
2. Deploy ulang Web App jika Code.gs berubah.
3. Upload `analisis.html` ke repo GitHub Pages, satu folder dengan assets.
4. Pastikan URL API pada `analisis.html` menunjuk ke deployment Web App yang sama.
5. Spreadsheet tetap yang sama.

Modul analisis tidak memanggil Gemini saat pengisian.
