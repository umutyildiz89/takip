const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require("../db");
const path = require("path");
const fs = require("fs");

// JWT doğrulama middleware'i
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

// Dosya listesini getir
router.get("/", verifyUser, async (req, res) => {
  try {
    let files;
    if (req.user.role === "admin") {
      [files] = await pool.query(
        "SELECT * FROM files ORDER BY upload_date DESC"
      );
    } else {
      [files] = await pool.query(
        "SELECT * FROM files WHERE uploader_id = ? ORDER BY upload_date DESC",
        [req.user.id]
      );
    }
    files = files.map(f => ({
      ...f,
      details: f.details ? JSON.parse(f.details) : null
    }));
    res.json({ files });
  } catch (err) {
    console.error("Dosya listesi hatası:", err);
    res.status(500).json({ message: "Dosyalar alınamadı." });
  }
});

// Dosya indir
router.get("/download/:filename", verifyUser, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "..", "..", "uploads", filename);

  if (!fs.existsSync(filePath))
    return res.status(404).json({ message: "Dosya bulunamadı." });

  res.download(filePath);
});

// Detayları güncelle (sadece admin)
router.put("/:id/details", verifyUser, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Yetkisiz" });
    }
    const { details } = req.body;
    await pool.execute(
      "UPDATE files SET details = ? WHERE id = ?",
      [JSON.stringify(details), req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Detay güncelleme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// Dosya silme (sadece admin)
router.delete("/:id", verifyUser, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Yetkisiz" });
    }
    const fileId = req.params.id;

    // Dosya bilgisi çek
    const [rows] = await pool.query("SELECT * FROM files WHERE id = ?", [fileId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Dosya bulunamadı." });
    }
    const filename = rows[0].filename;
    const filePath = path.join(__dirname, "..", "..", "uploads", filename);

    // Dosyayı fiziksel olarak sil
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Veritabanından kaydı sil
    await pool.query("DELETE FROM files WHERE id = ?", [fileId]);

    res.json({ message: "Dosya başarıyla silindi." });
  } catch (err) {
    console.error("Dosya silme hatası:", err);
    res.status(500).json({ message: "Dosya silinemedi." });
  }
});

// İstatistik endpoint
router.get("/stats", verifyUser, async (req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const isAdmin = req.user.role === "admin";
    const userId = req.user.id;

    async function getStatsSince(date) {
      let query = `
        SELECT
          SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(details, '$.aranmadi')) AS UNSIGNED)) AS aranmadi,
          SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(details, '$.tekrar_aranacak')) AS UNSIGNED)) AS tekrar_aranacak,
          SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(details, '$.yakin_takip')) AS UNSIGNED)) AS yakin_takip,
          SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(details, '$.takip')) AS UNSIGNED)) AS takip,
          SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(details, '$.uzak_takip')) AS UNSIGNED)) AS uzak_takip,
          SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(details, '$.numara_hatali')) AS UNSIGNED)) AS numara_hatali,
          SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(details, '$.ilgisiz')) AS UNSIGNED)) AS ilgisiz,
          SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(details, '$.gercek_hesap')) AS UNSIGNED)) AS gercek_hesap,
          SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(details, '$.erisim_yok')) AS UNSIGNED)) AS erisim_yok,
          SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(details, '$.mesgul')) AS UNSIGNED)) AS mesgul,
          COUNT(*) AS total
        FROM files
        WHERE upload_date >= ? AND details IS NOT NULL
      `;

      const params = [date];
      if (!isAdmin) {
        query += " AND uploader_id = ?";
        params.push(userId);
      }

      const [rows] = await pool.query(query, params);
      return rows[0] || {};
    }

    const stats = {
      lastDay: await getStatsSince(oneDayAgo),
      lastWeek: await getStatsSince(oneWeekAgo),
      lastMonth: await getStatsSince(oneMonthAgo),
      lastYear: await getStatsSince(oneYearAgo),
    };

    res.json({ stats });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "İstatistik alınamadı." });
  }
});

module.exports = router;
