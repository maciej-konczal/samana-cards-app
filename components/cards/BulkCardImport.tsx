import React, { useState } from "react";
import { toast } from "react-toastify";

interface BulkCardImportProps {
  languages: { id: string; name: string; iso_2: string }[];
  onImport: (
    cards: {
      text: string;
      text_language: string;
      translations: { text: string; language_id: string }[];
    }[]
  ) => void;
}

export default function BulkCardImport({
  languages,
  onImport,
}: BulkCardImportProps) {
  const [pastedData, setPastedData] = useState("");
  const [preview, setPreview] = useState<any[]>([]);

  const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPastedData(text);

    const rows = text.split("\n").filter((row) => row.trim() !== "");
    const headers = rows[0].split("\t");

    const previewData = rows.slice(1).map((row) => {
      const values = row.split("\t");
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index];
        return obj;
      }, {});
    });

    setPreview(previewData);
  };

  const handleImport = () => {
    const importedCards = preview.map((row) => {
      const card = {
        text: row.text,
        text_language: row.text_language,
        translations: [],
      };
      Object.entries(row).forEach(([key, value]) => {
        if (key !== "text" && key !== "text_language" && value) {
          const language = languages.find((lang) => lang.iso_2 === key);
          if (language) {
            card.translations.push({
              text: value as string,
              language_id: language.id,
            });
          }
        }
      });
      return card;
    });

    onImport(importedCards);
    toast.success(`${importedCards.length} cards imported successfully!`);
    setPastedData("");
    setPreview([]);
  };

  return (
    <div className="space-y-4">
      <textarea
        value={pastedData}
        onChange={handlePaste}
        placeholder="Paste your data here (tab-separated values)"
        className="w-full h-40 p-2 border rounded"
      />
      {preview.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Preview:</h3>
          <table className="w-full border-collapse border">
            <thead>
              <tr>
                {Object.keys(preview[0]).map((header) => (
                  <th key={header} className="border p-2">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, i) => (
                    <td key={i} className="border p-2">
                      {value as string}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {preview.length > 0 && (
        <button
          onClick={handleImport}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Import Cards
        </button>
      )}
    </div>
  );
}
