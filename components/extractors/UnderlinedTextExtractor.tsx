"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface UnderlinedText {
  phrase: string;
  context: string;
}

interface Language {
  id: string;
  name: string;
  iso_2: string;
}

interface UnderlinedTextExtractorProps {
  card_set_id: string;
}

export default function UnderlinedTextExtractor({
  card_set_id,
}: UnderlinedTextExtractorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<UnderlinedText[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<{
    [key: number]: string;
  }>({});
  const [translations, setTranslations] = useState<{ [key: number]: string }>(
    {}
  );

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const response = await fetch("/api/languages");
      const data = await response.json();
      setLanguages(data);
    } catch (error) {
      console.error("Error fetching languages:", error);
    }
  };

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

  const handleLanguageChange = (index: number, languageId: string) => {
    setSelectedLanguages({ ...selectedLanguages, [index]: languageId });
  };

  const handleTranslationChange = (index: number, text: string) => {
    setTranslations({ ...translations, [index]: text });
  };

  const handleAddCard = async (index: number) => {
    const phrase = extractedText[index].phrase;
    const languageId = selectedLanguages[index];
    const translatedText = translations[index];

    if (!languageId) {
      toast.error("Please select a language");
      return;
    }

    if (!translatedText) {
      toast.error("Please enter a translation");
      return;
    }

    try {
      const response = await fetch("/api/cards/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: phrase,
          card_set_id: card_set_id,
          languageId: languageId,
          translatedText: translatedText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add card");
      }

      toast.success("Card added successfully");
      // Clear the input fields after successful addition
      setSelectedLanguages({ ...selectedLanguages, [index]: "" });
      setTranslations({ ...translations, [index]: "" });
    } catch (error) {
      console.error("Error adding card:", error);
      toast.error("Failed to add card");
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
                <th className="border border-gray-300 p-2 text-left">
                  Language
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Translation
                </th>
                <th className="border border-gray-300 p-2 text-left">Action</th>
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
                  <td className="border border-gray-300 p-2">
                    <select
                      value={selectedLanguages[index] || ""}
                      onChange={(e) =>
                        handleLanguageChange(index, e.target.value)
                      }
                      className="w-full p-1 border rounded"
                    >
                      <option value="">Select Language</option>
                      {languages.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="text"
                      value={translations[index] || ""}
                      onChange={(e) =>
                        handleTranslationChange(index, e.target.value)
                      }
                      placeholder="Enter translation"
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <button
                      onClick={() => handleAddCard(index)}
                      className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Add Card
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
