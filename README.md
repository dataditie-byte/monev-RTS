# Monev RTS Dit IE 2026 — Browser STT Final

## Konsep
Versi ini memisahkan proses pengisian dari Gemini.

**Pengisian:**
1. Personel mengisi identitas.
2. Pilih Guru Pendamping RTS atau Siswa/Fasilitator RTS.
3. Pilih YA/TIDAK.
4. Tekan Mulai Rekam.
5. Browser merekam audio dan menjalankan Speech Recognition Bahasa Indonesia (`id-ID`) secara langsung.
6. Setelah Hentikan, audio asli + transcript + YA/TIDAK dikirim sekali ke Apps Script.
7. Apps Script hanya menyimpan data ke Google Sheet dan audio ke Google Drive.

**Gemini tidak dipanggil pada proses pengisian.** Kuota Gemini tidak memblokir pengisian.

## Browser
Gunakan Google Chrome di Android/Windows/Mac untuk dukungan Speech Recognition yang paling konsisten. Izin mikrofon harus diizinkan.

## Spreadsheet
Gunakan `Monev_RTS_DitIE_2026_FOUNDATION_FINAL.xlsx` sebagai dasar Google Spreadsheet.
Sheet:
- CONFIG
- PERTANYAAN
- PENGISIAN
- JAWABAN
- ANALISIS
- QUEUE_AI
- RINGKASAN

Pertanyaan canonical sudah dikunci di Code.gs dan juga di frontend sebagai fallback.

## Apps Script
1. Buat project Apps Script.
2. Masukkan `Code.gs` dan `appsscript.json`.
3. Hubungkan spreadsheet dengan Script Property:
   - `SPREADSHEET_ID` = ID Google Spreadsheet Monev RTS.
4. Jalankan `seedCanonicalQuestions()` sekali bila ingin menulis ulang 27 pertanyaan ke sheet PERTANYAAN.
5. Deploy sebagai Web App:
   - Execute as: Me
   - Who has access: sesuai kebutuhan organisasi.
6. Salin URL `/exec` deployment ke konstanta `API_URL` di index.html.

Tidak diperlukan `GEMINI_API_KEY` untuk pengisian.

## GitHub Pages
Upload:
- index.html
- folder assets/

Asset:
- logo-bnn.webp
- logo-ananda-bersinar.webp
- header-war-on-drugs-humanity.webp

## Catatan desain
Header dibuat ringkas agar tidak mengambil separuh layar. Logo Ananda Bersinar tetap tampil. Tidak ada label teknis seperti "Frontend V2/Final" di tampilan pengguna.
