import React, { useEffect, useState } from "react";
import "../styles/StatsSummary.css";

const STATUS_LABELS = {
  aranmadi: "aranmadi",
  tekrar_aranacak: "Tekrar Aranacak",
  yakin_takip: "Yakın Takip",
  takip: "Takip",
  uzak_takip: "Uzak Takip",
  numara_hatalı: "Numara Hatalı",
  ilgisiz: "İlgisiz",
  gercek_hesap: "Gerçek Hesap",
  erisim_yok: "Erişim Yok",
  mesgul: "Meşgul",
};

function StatsSummary() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/files/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      // API’den gelen veriyi konsola yazdır
      console.log("API’den gelen stats verisi:", data);

      setStats(data.stats);
    } catch (err) {
      console.error("Stats fetch error:", err);
      setStats(null);
    }
    setLoading(false);
  };

  if (loading) return <div className="stats-summary">Yükleniyor...</div>;
  if (!stats) return <div className="stats-summary">Veri alınamadı.</div>;

  const statKeys = Object.keys(STATUS_LABELS);

  const getCount = (timeKey, statKey) => {
    return stats[timeKey]?.[statKey] || 0;
  };

  const getTotal = (timeKey) => stats[timeKey]?.total || 0;

  return (
    <div className="stats-summary">
      <h3>Son Yükleme İstatistikleri</h3>
      <div className="stats-cards-container">
        {["lastDay", "lastWeek", "lastMonth", "lastYear"].map((timeKey) => {
          let title = "";
          if (timeKey === "lastDay") title = "Son Gün";
          else if (timeKey === "lastWeek") title = "Son Hafta";
          else if (timeKey === "lastMonth") title = "Son Ay";
          else if (timeKey === "lastYear") title = "Son Yıl";

          return (
            <div className="stats-card" key={timeKey}>
              <h4>{title}</h4>
              <table>
                <thead>
                  <tr>
                    <th>Statü</th>
                    <th>Adet</th>
                  </tr>
                </thead>
                <tbody>
                  {statKeys.map((statKey) => (
                    <tr key={statKey}>
                      <td>{STATUS_LABELS[statKey]}</td>
                      <td>{getCount(timeKey, statKey)}</td>
                    </tr>
                  ))}
                  <tr className="stats-total-row">
                    <td><b>Toplam</b></td>
                    <td><b>{getTotal(timeKey)}</b></td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StatsSummary;
