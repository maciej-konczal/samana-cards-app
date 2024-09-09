"use client";

import React, { useState } from "react";

interface UnderlinedText {
  phrase: string;
  context: string;
}

export default function UnderlinedTextExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<UnderlinedText[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setExtractedText([]);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/extract-underlined/api", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract underlined text");
      }

      console.log("Received data:", data);

      if (data.underlinedText) {
        const parsedText: UnderlinedText[] = JSON.parse(data.underlinedText);
        setExtractedText(parsedText);
      } else {
        setError("No underlined text found in the image");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-2 block"
        />
        <button
          type="submit"
          disabled={!file || isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {isLoading ? "Extracting..." : "Extract Underlined Text"}
        </button>
      </form>
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      {extractedText.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Extracted Underlined Text:
          </h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Phrase</th>
                <th className="border border-gray-300 p-2 text-left">
                  Context
                </th>
              </tr>
            </thead>
            <tbody>
              {extractedText.map((item, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="border border-gray-300 p-2">{item.phrase}</td>
                  <td className="border border-gray-300 p-2">{item.context}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
