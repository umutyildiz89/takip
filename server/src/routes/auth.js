const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../db");

// Giriş: /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "E-posta ve şifre zorunlu." });

  try {
    // Kullanıcıyı veritabanında bul
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    const user = rows[0];
    if (!user)
      return res.status(401).json({ message: "Kullanıcı bulunamadı." });

    // Şifre kontrolü
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Şifre hatalı." });

    // JWT oluştur
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    res.json({
      token,
      role: user.role,
      email: user.email,
      id: user.id,
      message: "Giriş başarılı."
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

module.exports = router;
