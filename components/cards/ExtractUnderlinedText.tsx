"use client";

import React, { useState, useRef } from "react";
import { toast } from "react-toastify";

interface UnderlinedText {
  phrase: string;
  context: string;
}

interface ExtractUnderlinedTextProps {
  onExtract: (extractedText: UnderlinedText[]) => void;
}

export default function ExtractUnderlinedText({
  onExtract,
}: ExtractUnderlinedTextProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/extractUnderlined", {
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
        onExtract(parsedText);
      } else {
        toast.error("No underlined text found in the image");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while extracting text");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Choose File
          </button>
          <span className="text-gray-700">
            {file ? file.name : "No file chosen"}
          </span>
        </div>
        <button
          type="submit"
          disabled={!file || isLoading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? "Extracting..." : "Extract Text"}
        </button>
      </form>
    </div>
  );
}
