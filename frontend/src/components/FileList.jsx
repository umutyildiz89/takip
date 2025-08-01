import React, { useEffect, useState } from "react";
import StatusUpdate from "./StatusUpdate";
import ExcelDetailsPanel from "./ExcelDetailsPanel";
import "../styles/FileList.css";

function FileList() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/files", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setFiles(data.files || []);
    } catch {
      setFiles([]);
    }
    setLoading(false);
  };

  const handleDownload = async (filename) => {
    window.open(`http://localhost:5000/api/files/download/${filename}`, "_blank");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu dosya silinsin mi?")) return;
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/files/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        alert("Dosya başarıyla silindi.");
        fetchFiles();  // Silmeden sonra listeyi yenile
      } else {
        alert("Dosya silinemedi.");
      }
    } catch {
      alert("Sunucu hatası.");
    }
    setLoading(false);
  };

  return (
    <div className="filelist-container">
      <h3>{userRole === "admin" ? "Tüm Yüklemeler" : "Yüklediğin Dosyalar"}</h3>
      {loading ? (
        <div className="filelist-loading">Yükleniyor...</div>
      ) : files.length === 0 ? (
        <div className="filelist-empty">Henüz dosya yok.</div>
      ) : (
        <>
          <table className="filelist-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Dosya Adı</th>
                <th>Yükleme Tarihi</th>
                <th>Statü</th>
                <th>İndir</th>
                <th>Sil</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, i) => (
                <tr key={file.id}>
                  <td>{i + 1}</td>
                  <td>{file.filename}</td>
                  <td>{new Date(file.upload_date).toLocaleString()}</td>
                  <td>
                    {userRole === "admin" ? (
                      <StatusUpdate
                        fileId={file.id}
                        currentStatus={file.status}
                        onUpdated={fetchFiles}
                      />
                    ) : (
                      <span className={`filelist-status filelist-status-${file.status}`}>
                        {file.status}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="filelist-download-btn"
                      onClick={() => handleDownload(file.filename)}
                    >
                      İndir
                    </button>
                  </td>
                  <td>
                    {userRole === "admin" && (
                      <button
                        className="filelist-delete-btn"
                        onClick={() => handleDelete(file.id)}
                        disabled={loading}
                      >
                        Sil
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Admin ise detay panelini göster */}
          {userRole === "admin" && (
            <div style={{ marginTop: "38px" }}>
              <ExcelDetailsPanel files={files} onUpdate={fetchFiles} />
            </div>
          )}

          {/* Normal kullanıcı için detay paneli (readOnly) */}
          {userRole !== "admin" && (
            <div style={{ marginTop: "38px" }}>
              <ExcelDetailsPanel files={files} readOnly />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FileList;
