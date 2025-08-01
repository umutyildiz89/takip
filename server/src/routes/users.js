const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("../db");
const jwt = require("jsonwebtoken");

// Basit admin doğrulama middleware
function isAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token yok." });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin")
      return res.status(403).json({ message: "Yetkisiz." });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Geçersiz token." });
  }
}

// Tüm kullanıcıları getir (sadece admin)
router.get("/", isAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, email, role FROM users ORDER BY id"
    );
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Kullanıcılar alınamadı." });
  }
});

// Yeni kullanıcı ekle (sadece admin)
router.post("/create", isAdmin, async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role)
    return res.status(400).json({ message: "Tüm alanlar zorunlu." });

  try {
    // Kullanıcı zaten var mı?
    const [exists] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (exists.length > 0)
      return res.status(400).json({ message: "Bu e-posta zaten kayıtlı." });

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      [email, hashed, role]
    );
    res.json({ message: "Kullanıcı başarıyla eklendi." });
  } catch (err) {
    res.status(500).json({ message: "Kullanıcı eklenemedi." });
  }
});

// Kullanıcı sil (sadece admin)
router.delete("/delete/:id", isAdmin, async (req, res) => {
  const userId = req.params.id;
  try {
    const [del] = await pool.query("DELETE FROM users WHERE id = ?", [userId]);
    if (del.affectedRows === 0)
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    res.json({ message: "Kullanıcı silindi." });
  } catch (err) {
    res.status(500).json({ message: "Kullanıcı silinemedi." });
  }
});

module.exports = router;
