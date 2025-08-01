const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Ortam değişkenlerini yükle
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Yüklenen dosyalar için statik servis
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Route dosyalarını ekle
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");
const filesRoutes = require("./routes/files");
const statusRoutes = require("./routes/status");
const usersRoutes = require("./routes/users");

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/users", usersRoutes);

// Sağlık kontrolü endpoint'i
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server çalışıyor." });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});

module.exports = app;
