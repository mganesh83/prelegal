"use client";

import { useState, useEffect, useCallback } from "react";

interface Party {
  name: string;
  title: string;
  company: string;
  notice_address: string;
  date: string;
}

interface MndaFormData {
  purpose: string;
  effective_date: string;
  mnda_term_type: "expires" | "continues";
  mnda_term_years: number | null;
  confidentiality_term_type: "years" | "perpetuity";
  confidentiality_years: number | null;
  governing_law: string;
  jurisdiction: string;
  party1: Party;
  party2: Party;
}

const initialFormData: MndaFormData = {
  purpose: "",
  effective_date: "",
  mnda_term_type: "expires",
  mnda_term_years: null,
  confidentiality_term_type: "years",
  confidentiality_years: null,
  governing_law: "",
  jurisdiction: "",
  party1: { name: "", title: "", company: "", notice_address: "", date: "" },
  party2: { name: "", title: "", company: "", notice_address: "", date: "" },
};

const API_BASE = "http://localhost:8000/api/mnda";

export default function Home() {
  const [formData, setFormData] = useState<MndaFormData>(initialFormData);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = useCallback(async (data: MndaFormData) => {
    setIsPreviewLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const html = await response.text();
        setPreviewHtml(html);
      } else {
        setError(`Preview failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to fetch preview:", error);
      setError("Failed to connect to backend. Is it running on port 8000?");
    } finally {
      setIsPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreview(formData);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, fetchPreview]);

  const updateField = <K extends keyof MndaFormData>(
    key: K,
    value: MndaFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updatePartyField = (party: "party1" | "party2", field: keyof Party, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [party]: { ...prev[party], [field]: value },
    }));
  };

  const handleDownload = async (format: "pdf" | "docx" | "md") => {
    setIsDownloading(format);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/download/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mnda.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        setError(`Download failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Failed to download ${format}:`, error);
      setError("Failed to connect to backend for download.");
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Mutual NDA Generator</h1>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-[1920px] mx-auto">
        {error && (
          <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md shadow-sm max-w-md">
            <p className="text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-600 hover:text-red-800 mt-1 underline"
            >
              Dismiss
            </button>
          </div>
        )}
        {/* Form Panel */}
        <div className="w-full lg:w-1/2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-6"
          >
            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose
              </label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => updateField("purpose", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Purpose of the NDA"
              />
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective Date
              </label>
              <input
                type="date"
                value={formData.effective_date}
                onChange={(e) => updateField("effective_date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* MNDA Term */}
            <fieldset className="border border-gray-200 rounded-md p-4">
              <legend className="text-sm font-medium text-gray-700 px-2">
                MNDA Term
              </legend>
              <div className="space-y-3 mt-2">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mnda_term_type"
                      value="expires"
                      checked={formData.mnda_term_type === "expires"}
                      onChange={() => updateField("mnda_term_type", "expires")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Expires after</span>
                  </label>
                  {formData.mnda_term_type === "expires" && (
                    <input
                      type="number"
                      min="1"
                      value={formData.mnda_term_years ?? ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateField(
                          "mnda_term_years",
                          isNaN(val) ? null : val
                        );
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Years"
                    />
                  )}
                  <span className="text-sm text-gray-500">years</span>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mnda_term_type"
                    value="continues"
                    checked={formData.mnda_term_type === "continues"}
                    onChange={() => updateField("mnda_term_type", "continues")}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Continues indefinitely</span>
                </label>
              </div>
            </fieldset>

            {/* Term of Confidentiality */}
            <fieldset className="border border-gray-200 rounded-md p-4">
              <legend className="text-sm font-medium text-gray-700 px-2">
                Term of Confidentiality
              </legend>
              <div className="space-y-3 mt-2">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="confidentiality_term_type"
                      value="years"
                      checked={formData.confidentiality_term_type === "years"}
                      onChange={() =>
                        updateField("confidentiality_term_type", "years")
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Expires after</span>
                  </label>
                  {formData.confidentiality_term_type === "years" && (
                    <input
                      type="number"
                      min="1"
                      value={formData.confidentiality_years ?? ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateField(
                          "confidentiality_years",
                          isNaN(val) ? null : val
                        );
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Years"
                    />
                  )}
                  <span className="text-sm text-gray-500">years</span>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="confidentiality_term_type"
                    value="perpetuity"
                    checked={formData.confidentiality_term_type === "perpetuity"}
                    onChange={() =>
                      updateField("confidentiality_term_type", "perpetuity")
                    }
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">In perpetuity</span>
                </label>
              </div>
            </fieldset>

            {/* Governing Law & Jurisdiction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Governing Law
                </label>
                <input
                  type="text"
                  value={formData.governing_law}
                  onChange={(e) => updateField("governing_law", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., State of New York"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jurisdiction
                </label>
                <input
                  type="text"
                  value={formData.jurisdiction}
                  onChange={(e) => updateField("jurisdiction", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Courts of New York County"
                />
              </div>
            </div>

            {/* Party 1 */}
            <fieldset className="border border-gray-200 rounded-md p-4">
              <legend className="text-sm font-medium text-gray-700 px-2">
                Party 1
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.party1.name}
                    onChange={(e) => updatePartyField("party1", "name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.party1.title}
                    onChange={(e) => updatePartyField("party1", "title", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.party1.company}
                    onChange={(e) => updatePartyField("party1", "company", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Notice Address
                  </label>
                  <input
                    type="text"
                    value={formData.party1.notice_address}
                    onChange={(e) => updatePartyField("party1", "notice_address", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.party1.date}
                    onChange={(e) => updatePartyField("party1", "date", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </fieldset>

            {/* Party 2 */}
            <fieldset className="border border-gray-200 rounded-md p-4">
              <legend className="text-sm font-medium text-gray-700 px-2">
                Party 2
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.party2.name}
                    onChange={(e) => updatePartyField("party2", "name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.party2.title}
                    onChange={(e) => updatePartyField("party2", "title", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.party2.company}
                    onChange={(e) => updatePartyField("party2", "company", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Notice Address
                  </label>
                  <input
                    type="text"
                    value={formData.party2.notice_address}
                    onChange={(e) => updatePartyField("party2", "notice_address", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.party2.date}
                    onChange={(e) => updatePartyField("party2", "date", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </fieldset>
          </form>
        </div>

        {/* Preview Panel */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">Preview</h2>
            <div className="flex gap-2">
              {(["pdf", "docx", "md"] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => handleDownload(format)}
                  disabled={isDownloading === format}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDownloading === format ? "Downloading..." : `Download ${format.toUpperCase()}`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-[600px]">
            {isPreviewLoading && !previewHtml ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-500">Loading preview...</p>
              </div>
            ) : previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                title="NDA Preview"
                className="w-full h-full min-h-[600px] border-0"
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-500">Fill in the form to see preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
