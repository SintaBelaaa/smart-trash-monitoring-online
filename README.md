# Smart Trash Monitoring — ESP32 + FC-51 + SG90

Dashboard web responsif yang bisa dibuka dari HP/laptop melalui URL hosting publik. ESP32 mengirim status melalui HTTPS; pengunjung hanya dapat membaca status dashboard, sedangkan endpoint pengiriman data dilindungi `DEVICE_TOKEN`.

## Fitur
- Status ESP32 online/offline (online jika data diterima dalam 60 detik terakhir).
- Status sensor infrared FC-51 dan tutup servo.
- Pembaruan dashboard otomatis setiap 3 detik.
- Tidak memakai localhost setelah deployment.
- Endpoint perangkat dilindungi token.

> Penting: FC-51 mendeteksi objek/tangan di dekat sensor, bukan persentase kepenuhan sampah. Untuk mengukur tingkat kepenuhan, diperlukan sensor jarak atau sensor lain yang sesuai.

## Menjalankan di komputer untuk uji awal
1. Install Node.js versi 18 atau lebih baru.
2. Buka folder proyek di VS Code.
3. Jalankan `npm install`.
4. Salin `.env.example` menjadi `.env`.
5. Isi `DEVICE_TOKEN` dengan string rahasia yang panjang.
6. Jalankan `npm start`.

Uji awal di komputer biasanya menggunakan `http://localhost:3000`; ini hanya untuk tes lokal. Untuk akses publik, ikuti deployment di bawah.

## Deploy publik dengan Render + GitHub
1. Upload isi folder proyek ini ke repository GitHub.
2. Masuk ke Render dan buat **New Web Service**, lalu hubungkan repository tersebut.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Pada Environment Variables, tambahkan `DEVICE_TOKEN` dengan nilai rahasia panjang. Jangan commit file `.env` ke GitHub.
6. Deploy dan tunggu sampai Render memberikan URL HTTPS seperti `https://nama-aplikasi.onrender.com`.
7. Buka URL HTTPS itu dari HP/laptop. Itulah alamat dashboard publik.
8. Buka `esp32/smart_trash_esp32.ino`, isi SSID/password Wi-Fi, `API_URL` dengan URL Render + `/api/trash/device`, dan `DEVICE_TOKEN` dengan nilai yang sama seperti di Render.
9. Upload program ke ESP32. Buka Serial Monitor 115200 baud untuk melihat hasil koneksi.

Jika menggunakan `render.yaml`, tetap periksa Environment Variables di dashboard Render dan pastikan `DEVICE_TOKEN` tersedia. Setelah mengubah kode, deploy ulang.

## Wiring
- FC-51 VCC → 3V3 ESP32 (pastikan modul mendukung tegangan ini)
- FC-51 GND → GND ESP32
- FC-51 OUT → GPIO 27
- SG90 signal (kabel oranye/kuning) → GPIO 18
- SG90 VCC (merah) → supply 5V eksternal yang memadai
- SG90 GND (cokelat/hitam) → GND supply
- GND supply servo → GND ESP32

Jangan mengambil daya servo dari pin 3V3 ESP32. Pastikan GND disatukan. Uji sudut servo tanpa memasang beban tutup terlebih dahulu dan sesuaikan `LID_CLOSED_ANGLE`/`LID_OPEN_ANGLE`.

## Catatan operasional
- Contoh ini menyimpan status terakhir di memori server. Jika service restart, status akan kembali menunggu data sampai ESP32 mengirim lagi.
- Hosting gratis tertentu dapat tidur saat tidak digunakan; pengiriman pertama setelah service aktif mungkin terlambat.
- URL dashboard bisa diakses publik, tetapi hanya perangkat dengan token yang benar bisa mengirim data.
- Jangan membagikan token ke orang lain atau memasukkannya ke repository publik.
