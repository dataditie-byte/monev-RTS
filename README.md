# Monev RTS Dit IE 2026 — Paket Full Final

Paket ini menggabungkan frontend, backend Apps Script, instrumen pertanyaan final, aset header BNN/Ananda Bersinar, transkripsi Gemini Bahasa Indonesia, penyimpanan audio Drive, queue retry, resume session, dan penyelesaian pengisian.

## Instrumen terkunci
- Guru Pendamping RTS: 18 pertanyaan
- Siswa/Fasilitator RTS: 9 pertanyaan
- Jawaban: YA/TIDAK
- Penjelasan: rekaman suara
- Transkripsi: Bahasa Indonesia

## API
Web App Apps Script: https://script.google.com/macros/s/AKfycbyLcNTNZyZUfopI50Fw2HmX8fJPGJPcvS3RsLUxl8geydfHE7yF-a9MeszT_Eynq9Dp/exec

## Catatan deploy
1. Gunakan Spreadsheet final pada paket.
2. Deploy `Code.gs` sebagai Web App.
3. Script Properties: `SPREADSHEET_ID` dan `GEMINI_API_KEY`.
4. Model transkripsi: `gemini-3.5-transcribe`.
5. Pasang trigger `installQueueTrigger()` sekali setelah deploy.
6. Frontend `index.html` dan folder `assets/` di GitHub Pages.

Frontend tidak menampilkan label versi pengembangan.
