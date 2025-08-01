import React from "react";
import Header from "../components/Header";
import Upload from "../components/Upload";
import FileList from "../components/FileList";
import AdminPanel from "../components/AdminPanel";

function Dashboard() {
  const userRole = localStorage.getItem("userRole");

  return (
    <div style={{minHeight:"100vh", background:"linear-gradient(120deg,#e4ebf9 30%, #f0eaff 100%)"}}>
      <Header />
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "34px",
        paddingTop: "50px"
      }}>
        {userRole === "admin" && <AdminPanel />}
        <Upload />
        <FileList />
      </div>
    </div>
  );
}

export default Dashboard;
