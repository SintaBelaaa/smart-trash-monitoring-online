#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>

// GANTI dengan Wi-Fi yang digunakan ESP32.
const char* WIFI_SSID = "NAMA_WIFI";
const char* WIFI_PASSWORD = "PASSWORD_WIFI";

// GANTI dengan URL Render setelah aplikasi berhasil di-deploy.
// Jangan gunakan localhost atau alamat IP lokal.
const char* API_URL = "https://NAMA-APLIKASI.onrender.com/api/trash/device";

// Harus sama persis dengan Environment Variable DEVICE_TOKEN di hosting.
const char* DEVICE_TOKEN = "ISI_TOKEN_RAHASIA_DI_SINI";

const int IR_PIN = 27;       // OUT sensor FC-51
const int SERVO_PIN = 18;    // Signal servo SG90
const int LID_CLOSED_ANGLE = 0;
const int LID_OPEN_ANGLE = 90;
const unsigned long LID_OPEN_MS = 3000;
const unsigned long SEND_INTERVAL_MS = 5000;

Servo lidServo;
bool handDetected = false;
bool lidOpen = false;
unsigned long lastDetectionMs = 0;
unsigned long lastSendMs = 0;

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Menghubungkan Wi-Fi");

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi tersambung");
    Serial.print("IP ESP32: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWi-Fi belum tersambung; akan mencoba lagi.");
  }
}

void sendStatus() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  // Memudahkan uji coba HTTPS. Untuk penerapan permanen, gunakan validasi sertifikat CA.
  client.setInsecure();

  HTTPClient https;
  if (!https.begin(client, API_URL)) {
    Serial.println("Gagal memulai koneksi HTTPS");
    return;
  }

  https.addHeader("Content-Type", "application/json");
  https.addHeader("x-device-token", DEVICE_TOKEN);

  String payload = "{";
  payload += "\"device_id\":\"ESP32-TRASH-01\",";
  payload += "\"hand_detected\":";
  payload += (handDetected ? "true" : "false");
  payload += ",\"lid_open\":";
  payload += (lidOpen ? "true" : "false");
  payload += "}";

  int httpCode = https.POST(payload);
  Serial.print("HTTP status: ");
  Serial.println(httpCode);
  if (httpCode > 0) {
    Serial.println(https.getString());
  } else {
    Serial.println(https.errorToString(httpCode));
  }
  https.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(IR_PIN, INPUT);

  // Servo SG90 memakai supply 5V eksternal yang memadai.
  // Satukan GND supply servo dengan GND ESP32.
  lidServo.setPeriodHertz(50);
  lidServo.attach(SERVO_PIN, 500, 2400);
  lidServo.write(LID_CLOSED_ANGLE);
  delay(500);

  connectWiFi();
  sendStatus();
}

void loop() {
  // Kebanyakan modul FC-51 memberi LOW ketika objek terdeteksi.
  // Jika modul milik Anda terbalik, ubah LOW menjadi HIGH.
  bool detectedNow = (digitalRead(IR_PIN) == LOW);

  if (detectedNow) {
    lastDetectionMs = millis();
    if (!lidOpen) {
      lidOpen = true;
      lidServo.write(LID_OPEN_ANGLE);
      Serial.println("Objek terdeteksi: tutup dibuka");
    }
  }

  handDetected = detectedNow;

  if (lidOpen && millis() - lastDetectionMs >= LID_OPEN_MS) {
    lidOpen = false;
    lidServo.write(LID_CLOSED_ANGLE);
    Serial.println("Tutup ditutup kembali");
  }

  if (millis() - lastSendMs >= SEND_INTERVAL_MS) {
    lastSendMs = millis();
    sendStatus();
  }

  delay(50);
}
