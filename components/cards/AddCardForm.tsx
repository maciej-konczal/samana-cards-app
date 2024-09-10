"use client";

import React, { useState, useEffect } from "react";

interface Language {
  id: string;
  name: string;
}

interface Translation {
  text: string;
  language_id: string;
}

interface NewCard {
  text: string;
  translations: Translation[];
}

interface AddCardFormProps {
  languages: Language[];
  onAddCard: (card: NewCard) => Promise<void>;
  initialText: string;
}

export default function AddCardForm({
  languages,
  onAddCard,
  initialText,
}: AddCardFormProps) {
  const [newCard, setNewCard] = useState<NewCard>({
    text: initialText,
    translations: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setNewCard((prevCard) => ({
      ...prevCard,
      text: initialText,
    }));
  }, [initialText]);

  const handleTranslationChange = (
    index: number,
    field: "text" | "language_id",
    value: string
  ) => {
    const updatedTranslations = [...newCard.translations];
    updatedTranslations[index] = {
      ...updatedTranslations[index],
      [field]: value,
    };
    setNewCard({ ...newCard, translations: updatedTranslations });
  };

  const addTranslationField = () => {
    setNewCard({
      ...newCard,
      translations: [...newCard.translations, { text: "", language_id: "" }],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onAddCard(newCard);
      setNewCard({ text: "", translations: [] });
    } catch (error) {
      console.error("Error adding card:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-4">
      <div>
        <input
          type="text"
          value={newCard.text}
          onChange={(e) => setNewCard({ ...newCard, text: e.target.value })}
          placeholder="Enter new card text"
          className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      {newCard.translations.map((translation, index) => (
        <div key={index} className="flex space-x-2">
          <input
            type="text"
            value={translation.text}
            onChange={(e) =>
              handleTranslationChange(index, "text", e.target.value)
            }
            placeholder="Translation"
            className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={translation.language_id}
            onChange={(e) =>
              handleTranslationChange(index, "language_id", e.target.value)
            }
            className="p-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Language</option>
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div>
        <button
          type="button"
          onClick={addTranslationField}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Add Translation
        </button>
      </div>
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? "Adding..." : "Add Card"}
        </button>
      </div>
    </form>
  );
}
