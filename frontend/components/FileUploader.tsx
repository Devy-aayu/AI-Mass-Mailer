"use client";

import { useState } from "react";
import { uploadLeads } from "../lib/api";

type Props = {
  onUploaded: (data: any) => void;
  campaignId: string;
};

export default function FileUploader({
  onUploaded,
  campaignId,
}: Props) {

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {

    const file =
      event.target.files?.[0];

    if (!file) return;

    setError("");
    setLoading(true);

    try {

      const result =
        await uploadLeads(file, campaignId);

      onUploaded(result);

    } catch (error: any) {

      setError(
        error?.message ||
        "Upload failed."
      );

    } finally {

      setLoading(false);

      // Allow selecting the same file again.
      event.target.value = "";
    }
  }

  return (
    <div>

      <div className="drop-zone">

        <div className="upload-icon">
          ↑
        </div>

        <div className="upload-title">
          Upload your lead file
        </div>

        <div className="upload-description">
          CSV, XLSX or XLS files are supported.
          <br />
          We'll automatically detect names and email addresses.
        </div>

        <label className="file-button">

          {loading
            ? "Processing..."
            : "Choose CSV / Excel"}

          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFile}
            className="file-input"
            disabled={loading}
          />

        </label>

      </div>

      {error && (

        <div
          style={{
            marginTop: 15,
            padding: 12,
            background: "#fff0f0",
            color: "#b42318",
            borderRadius: 9,
            fontSize: 13,
          }}
        >
          {error}
        </div>

      )}

    </div>
  );
}