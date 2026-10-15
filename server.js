require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DEVICE_TOKEN = process.env.DEVICE_TOKEN;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));

const state = {
  device_id: "ESP32-TRASH-01",
  hand_detected: false,
  lid_open: false,
  last_seen: null,
  last_event: "Menunggu data dari ESP32",
  online: false
};

app.get("/", (_req, res) => {
  res.render("index");
});

// Data yang dibaca dashboard. Hanya menampilkan data, tidak mengubah alat.
app.get("/api/trash", (_req, res) => {
  const lastSeenMs = state.last_seen ? new Date(state.last_seen).getTime() : 0;
  const online = lastSeenMs > 0 && (Date.now() - lastSeenMs) < 60000;

  res.json({
    ...state,
    online,
    server_time: new Date().toISOString()
  });
});

// Endpoint khusus ESP32. Jangan membagikan DEVICE_TOKEN kepada pengunjung.
app.post("/api/trash/device", (req, res) => {
  if (!DEVICE_TOKEN) {
    return res.status(500).json({
      ok: false,
      message: "DEVICE_TOKEN belum disetel pada environment hosting."
    });
  }

  const token = req.get("x-device-token");
  if (token !== DEVICE_TOKEN) {
    return res.status(401).json({ ok: false, message: "Token perangkat tidak valid." });
  }

  const { device_id, hand_detected, lid_open } = req.body || {};

  if (typeof hand_detected !== "boolean" || typeof lid_open !== "boolean") {
    return res.status(400).json({
      ok: false,
      message: "Kirim hand_detected dan lid_open dalam bentuk boolean."
    });
  }

  const previousHand = state.hand_detected;
  const previousLid = state.lid_open;

  state.device_id = String(device_id || "ESP32-TRASH-01").slice(0, 60);
  state.hand_detected = hand_detected;
  state.lid_open = lid_open;
  state.last_seen = new Date().toISOString();
  state.online = true;

  if (lid_open && !previousLid) {
    state.last_event = "Tutup terbuka otomatis";
  } else if (!lid_open && previousLid) {
    state.last_event = "Tutup tertutup kembali";
  } else if (hand_detected && !previousHand) {
    state.last_event = "Objek/tangan terdeteksi sensor infrared";
  }

  res.json({ ok: true, message: "Data ESP32 diterima", received_at: state.last_seen });
});

// Endpoint sederhana untuk pemeriksaan hosting.
app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Smart Trash Monitoring berjalan pada port ${PORT}`);
});
