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
  initialText = "",
}: AddCardFormProps) {
  const [text, setText] = useState(initialText);
  const [translations, setTranslations] = useState<Translation[]>([
    { text: "", language_id: "", examples: [] },
  ]);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleTranslationChange = (
    index: number,
    field: keyof Translation,
    value: string
  ) => {
    const newTranslations = [...translations];
    newTranslations[index] = { ...newTranslations[index], [field]: value };
    setTranslations(newTranslations);
  };

  const handleExampleChange = (
    translationIndex: number,
    exampleIndex: number,
    field: keyof Example,
    value: string
  ) => {
    const newTranslations = [...translations];
    newTranslations[translationIndex].examples[exampleIndex] = {
      ...newTranslations[translationIndex].examples[exampleIndex],
      [field]: value,
    };
    setTranslations(newTranslations);
  };

  const addTranslation = () => {
    setTranslations([
      ...translations,
      { text: "", language_id: "", examples: [] },
    ]);
  };

  const addExample = (translationIndex: number) => {
    const newTranslations = [...translations];
    newTranslations[translationIndex].examples.push({
      text: "",
      translation: "",
    });
    setTranslations(newTranslations);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !text.trim() ||
      translations.some((t) => !t.text.trim() || !t.language_id)
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    const newCard: NewCard = {
      text,
      translations: translations
        .map((t) => ({
          ...t,
          examples: t.examples.filter(
            (ex) => ex.text.trim() && ex.translation.trim()
          ),
        }))
        .filter((t) => t.text.trim() && t.language_id),
    };
    await onAddCard(newCard);
    setText("");
    setTranslations([{ text: "", language_id: "", examples: [] }]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="text"
          className="block text-sm font-medium text-gray-700"
        >
          Card Text
        </label>
        <input
          type="text"
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          required
        />
      </div>
      {translations.map((translation, translationIndex) => (
        <div key={translationIndex} className="space-y-4 border-t pt-4">
          <div>
            <label
              htmlFor={`translation-${translationIndex}`}
              className="block text-sm font-medium text-gray-700"
            >
              Translation {translationIndex + 1}
            </label>
            <input
              type="text"
              id={`translation-${translationIndex}`}
              value={translation.text}
              onChange={(e) =>
                handleTranslationChange(
                  translationIndex,
                  "text",
                  e.target.value
                )
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>
          <div>
            <label
              htmlFor={`language-${translationIndex}`}
              className="block text-sm font-medium text-gray-700"
            >
              Language
            </label>
            <select
              id={`language-${translationIndex}`}
              value={translation.language_id}
              onChange={(e) =>
                handleTranslationChange(
                  translationIndex,
                  "language_id",
                  e.target.value
                )
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            >
              <option value="">Select a language</option>
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Examples</h4>
            {translation.examples.map((example, exampleIndex) => (
              <div key={exampleIndex} className="flex space-x-2">
                <input
                  type="text"
                  value={example.text}
                  onChange={(e) =>
                    handleExampleChange(
                      translationIndex,
                      exampleIndex,
                      "text",
                      e.target.value
                    )
                  }
                  placeholder="Example"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <input
                  type="text"
                  value={example.translation}
                  onChange={(e) =>
                    handleExampleChange(
                      translationIndex,
                      exampleIndex,
                      "translation",
                      e.target.value
                    )
                  }
                  placeholder="Example Translation"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => addExample(translationIndex)}
              className="mt-2 px-3 py-1 text-sm border border-transparent rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Add Example
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addTranslation}
        className="mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Add Translation
      </button>
      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Card
        </button>
      </div>
    </form>
  );
}
