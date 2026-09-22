# Sistem Monitoring Remaja Teman Sebaya — Dit IE BNN 2026

Frontend statis untuk **Sistem Monitoring Remaja Teman Sebaya (RTS)** Direktorat Informasi & Edukasi BNN T.A. 2026.

## Isi repository

- `index.html` — aplikasi frontend lengkap (HTML + CSS + JavaScript).
- `assets/logo-bnn.webp` — logo BNN.
- `assets/logo-ananda-bersinar.webp` — logo Ananda Bersinar.
- `assets/header-war-on-drugs-humanity.webp` — visual header #WarOnDrugsForHumanity.

## Backend

Frontend terhubung ke Google Apps Script Web App yang sudah diuji pada sistem backend Monev RTS. API URL berada di dalam `index.html`.

**Jangan memasukkan API key Gemini ke repository.** API key tetap berada di Google Apps Script Script Properties.

## Deploy ke GitHub Pages

1. Buat repository GitHub, misalnya `monev-rts-dit-ie-2026`.
2. Upload seluruh isi folder repository ini.
3. Buka **Settings → Pages**.
4. Source: **Deploy from a branch**.
5. Branch: `main`, folder `/ (root)`.
6. Simpan.

Aplikasi dapat dibuka dari URL GitHub Pages setelah proses publikasi selesai.

## Catatan arsitektur

Repository ini hanya untuk **frontend**. Spreadsheet, Google Drive audio, Gemini API, queue worker, dan trigger 1-menit tetap berada di backend Google Apps Script. Production Form Satker tidak diubah.


### Header Visual
Header menggunakan artwork yang diberikan untuk sistem ini dalam format WebP (`assets/header-war-on-drugs-humanity.webp`). Visual ditampilkan sebagai banner penuh pada area hero; logo BNN dan Ananda Bersinar tetap berada pada area branding di atasnya.
