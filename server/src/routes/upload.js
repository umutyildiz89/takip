const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const pool = require("../db");

// Yükleme klasörü ayarları
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "..", "uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    // Sadece Excel dosyaları
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Sadece .xls veya .xlsx uzantılı dosyalar yükleyebilirsiniz."
        )
      );
    }
  },
});

// JWT ile kullanıcıyı doğrula
function verifyUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token yok." });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Geçersiz token." });
  }
}

// Dosya yükleme endpoint'i
router.post("/", verifyUser, upload.single("file"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "Dosya yüklenemedi." });

  const filename = req.file.filename;
  const uploader_id = req.user.id;
  const now = new Date();

  try {
    await pool.query(
      "INSERT INTO files (filename, uploader_id, upload_date, status) VALUES (?, ?, ?, ?)",
      [filename, uploader_id, now, "bekliyor"]
    );
    res.json({ message: "Dosya başarıyla yüklendi.", filename });
  } catch (err) {
    res.status(500).json({ message: "Veritabanına kaydedilemedi." });
  }
});

module.exports = router;
