const el = (id) => document.getElementById(id);

function setBadge(id, text, type) {
  const node = el(id);
  node.textContent = text;
  node.className = `badge ${type}`;
}

function formatTime(value) {
  if (!value) return "Belum ada data";
  const date = new Date(value);
  return date.toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}

async function refreshDashboard() {
  try {
    const response = await fetch("/api/trash", { cache: "no-store" });
    if (!response.ok) throw new Error("Gagal mengambil data");
    const data = await response.json();

    el("deviceId").textContent = data.device_id || "ESP32-TRASH-01";
    el("detailDevice").textContent = data.device_id || "—";
    el("deviceStatus").textContent = data.online ? "Online" : "Offline";
    el("connectionText").textContent = data.online ? "ESP32 terhubung" : "Menunggu ESP32";
    el("connectionDot").className = data.online ? "online" : "offline";
    setBadge("deviceBadge", data.online ? "Online" : "Offline", data.online ? "good" : "bad");

    el("sensorStatus").textContent = data.hand_detected ? "Terdeteksi" : "Tidak terdeteksi";
    el("detailSensor").textContent = data.hand_detected ? "Objek terdeteksi" : "Tidak ada objek";
    setBadge("sensorBadge", data.hand_detected ? "Objek terdeteksi" : "Area kosong", data.hand_detected ? "warn" : "good");

    el("lidStatus").textContent = data.lid_open ? "Terbuka" : "Tertutup";
    el("detailLid").textContent = data.lid_open ? "Terbuka" : "Tertutup";
    setBadge("lidBadge", data.lid_open ? "Terbuka" : "Tertutup", data.lid_open ? "warn" : "good");

    el("lastSeen").textContent = formatTime(data.last_seen);
    el("lastEvent").textContent = data.last_event || "Belum ada aktivitas";
  } catch (error) {
    el("connectionText").textContent = "Koneksi dashboard bermasalah";
    el("connectionDot").className = "offline";
  }
}

refreshDashboard();
setInterval(refreshDashboard, 3000);
