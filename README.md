# Monev RTS Dit IE 2026 — FULL V2

Versi ini mengunci UX yang diminta:

**Rekam → Hentikan → Transkripsi → Transkrip muncul di bawah audio → Simpan & Lanjut.**

Transkripsi dilakukan langsung setelah rekaman berhenti menggunakan Gemini 3.5 Transcribe melalui backend Apps Script. Google mendokumentasikan `gemini-3.5-transcribe` untuk file audio dan `gemini-3.5-transcribe-live` untuk streaming real-time. Versi ini menggunakan file transcription karena alurnya cocok dengan tombol Hentikan dan tetap menyimpan audio asli.

## Isi
- `index.html` — frontend GitHub Pages
- `Code.gs` — backend Apps Script V2
- `appsscript.json` — scope Apps Script
- `assets/` — logo dan artwork

## Script Properties
Set:
- `SPREADSHEET_ID`
- `GEMINI_API_KEY`

## CONFIG
Pastikan:
- `GEMINI_MODEL_TRANSCRIBE = gemini-3.5-transcribe`
- `DRIVE_FOLDER_NAME = Monev_RTS_DitIE_2026_Audio`
- `QUEUE_BATCH_SIZE = 3`
- `MAX_RETRY = 4`

## Alur
1. Frontend mengambil pertanyaan sekali.
2. Session dibuat.
3. User memilih YA/TIDAK.
4. User merekam.
5. User menekan Hentikan.
6. Audio dikirim ke backend.
7. Backend menyimpan audio asli ke Drive.
8. Backend meminta Gemini membuat transkripsi Bahasa Indonesia mode smart.
9. Frontend menerima transkrip dan langsung menampilkannya di bawah audio.
10. Tombol Simpan & Lanjut aktif.
11. Backend menyimpan YA/TIDAK + audio + transkrip ke `JAWABAN`.
12. Soal berikutnya tampil tanpa mengambil pertanyaan dari server lagi.
13. Pada soal terakhir, `finishSession` memverifikasi seluruh pertanyaan memiliki jawaban dan transkripsi.

## Catatan
- API key tidak pernah berada di frontend.
- Jika Gemini gagal setelah audio tersimpan, backend membuat fallback `QUEUE_AI`.
- Queue worker dapat dipasang dengan `installQueueTrigger()` untuk retry.
- Jangan mengubah backend Form Satker production.
