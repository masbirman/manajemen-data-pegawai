import React, { useState } from "react";
import { uploadFile, downloadTemplate } from "../api/api";
import "./FileUpload.css";

const VALID_UNITS = [
  "Dinas",
  "Cabdis Wil. 1",
  "Cabdis Wil. 2",
  "Cabdis Wil. 3",
  "Cabdis Wil. 4",
  "Cabdis Wil. 5",
  "Cabdis Wil. 6",
  "PPPK",
];

function FileUpload({ onUploadSuccess, onUploadError }) {
  const [file, setFile] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [unit, setUnit] = useState("Dinas");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel", // .xls
        "text/csv", // .csv
      ];

      const validExtensions = [".xlsx", ".xls", ".csv"];
      const fileExtension = selectedFile.name
        .substring(selectedFile.name.lastIndexOf("."))
        .toLowerCase();

      if (
        !validTypes.includes(selectedFile.type) &&
        !validExtensions.includes(fileExtension)
      ) {
        setMessage({
          type: "error",
          text: "Only .xlsx and .csv files are supported",
        });
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setMessage(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Please select a file first" });
      return;
    }

    if (!month || !year || !unit) {
      setMessage({
        type: "error",
        text: "Please select month, year, and unit",
      });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const result = await uploadFile(file, month, year, unit);
      setMessage({
        type: "success",
        text: `Successfully uploaded ${result.records_processed} records for ${unit} ${month}/${year}`,
      });

      // Clear file input
      setFile(null);

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (error) {
      const errorMessage = error.message || "Upload failed";
      setMessage({ type: "error", text: errorMessage });

      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate();
      setMessage({
        type: "success",
        text: "Template downloaded successfully",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to download template",
      });
    }
  };

  return (
    <div className="file-upload-container">
      <div className="header-with-button">
        <button
          className="download-template-button"
          onClick={handleDownloadTemplate}
          type="button"
        >
          📥 Download Template
        </button>
      </div>
      <div className="upload-form">
        <div
          className={`file-drop-zone ${dragActive ? "drag-active" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-input"
            accept=".xlsx,.csv"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <label htmlFor="file-input" className="file-input-label">
            {file ? (
              <div className="file-selected">
                <span className="file-icon">📄</span>
                <span className="file-name">{file.name}</span>
              </div>
            ) : (
              <div className="file-placeholder">
                <span className="upload-icon">📁</span>
                <p>Drag and drop file here or click to browse</p>
                <p className="file-hint">Supported formats: .xlsx, .csv</p>
              </div>
            )}
          </label>
        </div>

        <div className="date-inputs">
          <div className="input-group">
            <label htmlFor="unit">Unit:</label>
            <select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {VALID_UNITS.map((unitOption) => (
                <option key={unitOption} value={unitOption}>
                  {unitOption}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="month">Bulan:</label>
            <select
              id="month"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleString("id-ID", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="year">Tahun:</label>
            <input
              type="number"
              id="year"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              min="2000"
              max="2100"
            />
          </div>
        </div>

        <button
          className="upload-button"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? (
            <>
              <span className="spinner"></span>
              Uploading...
            </>
          ) : (
            "Upload"
          )}
        </button>

        {message && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}
      </div>
    </div>
  );
}

export default FileUpload;
