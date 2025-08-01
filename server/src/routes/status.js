const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require("../db");

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

// Statü listesi: GET /api/status
router.get("/", verifyUser, async (req, res) => {
  const statusList = [
    { code: "bekliyor", name: "Bekliyor" },
    { code: "ilk_arama", name: "İlk arama" },
    { code: "yakin_takip", name: "Yakın takip" },
    { code: "takip", name: "Takip" },
    { code: "uzak_takip", name: "Uzak takip" },
    { code: "numara_hatalı", name: "Numara hatalı" },
    { code: "ilgisiz", name: "İlgisiz" },
    { code: "gercek_hesap", name: "Gerçek hesap" },
    { code: "erisilmedi", name: "Erişim yok" },
    { code: "mesgul", name: "Meşgul" }
  ];
  res.json({ statuses: statusList });
});

// Statü güncelle: POST /api/status/update
router.post("/update", verifyUser, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Yetkisiz." });

  const { fileId, status } = req.body;
  if (!fileId || !status)
    return res.status(400).json({ message: "Eksik veri." });

  try {
    await pool.query(
      "UPDATE files SET status = ? WHERE id = ?",
      [status, fileId]
    );
    res.json({ message: "Statü güncellendi." });
  } catch (err) {
    res.status(500).json({ message: "Statü güncellenemedi." });
  }
});

module.exports = router;
