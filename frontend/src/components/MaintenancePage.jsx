import React from "react";
import "./MaintenancePage.css";

const API_BASE_URL = process.env.REACT_APP_API_URL;

function MaintenancePage({ settings }) {
  const {
    title = "Sedang Dalam Perbaikan",
    message = "Sistem sedang dalam pemeliharaan. Silakan kembali beberapa saat lagi.",
    image_url,
    estimated_time,
  } = settings || {};

  return (
    <div className="maintenance-page">
      <div className="maintenance-container">
        {image_url && (
          <img
            src={
              image_url.startsWith("http")
                ? image_url
                : `${API_BASE_URL}${image_url}`
            }
            alt="Maintenance"
            className="maintenance-image"
          />
        )}

        {!image_url && <div className="maintenance-icon">🔧</div>}

        <h1>{title}</h1>
        <p className="maintenance-message">{message}</p>

        {estimated_time && (
          <div className="maintenance-time">
            <span className="time-icon">⏱️</span>
            <span>Estimasi selesai: {estimated_time}</span>
          </div>
        )}

        <div className="maintenance-footer">
          <p>Terima kasih atas kesabaran Anda</p>
        </div>
      </div>
    </div>
  );
}

export default MaintenancePage;
