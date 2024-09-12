"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FlagIcon } from "react-flag-kit";

interface Language {
  id: string;
  name: string;
  iso_2: string;
}

interface Translation {
  text: string;
  language_id: string;
}

interface Example {
  text: string;
  translation: string;
}

interface NewCard {
  text: string;
  translations: (Translation & { examples: Example[] })[];
}

interface AddCardFormProps {
  languages: Language[];
  onAddCard: (card: NewCard) => Promise<void>;
  initialCard?: CardType;
}

export default function AddCardForm({
  languages,
  onAddCard,
  initialCard,
}: AddCardFormProps) {
  const [text, setText] = useState(initialCard?.text || "");
  const [translations, setTranslations] = useState<
    (Translation & { examples: Example[] })[]
  >(
    initialCard?.translations || [
      { text: "", language_id: "", examples: [{ text: "", translation: "" }] },
    ]
  );

  useEffect(() => {
    if (initialCard) {
      setText(initialCard.text);
      setTranslations(initialCard.translations);
    }
  }, [initialCard]);

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
      { text: "", language_id: "", examples: [{ text: "", translation: "" }] },
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
      id: initialCard?.id,
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
    if (!initialCard) {
      setText("");
      setTranslations([
        {
          text: "",
          language_id: "",
          examples: [{ text: "", translation: "" }],
        },
      ]);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-lg rounded-lg overflow-hidden"
    >
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
        <h2 className="text-2xl font-bold text-white">
          {initialCard ? "Edit Card" : "Add New Card"}
        </h2>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <label
            htmlFor="text"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Card Text
          </label>
          <input
            type="text"
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            required
          />
        </div>
        {translations.map((translation, translationIndex) => (
          <div
            key={translationIndex}
            className="space-y-4 pt-4 border-t border-gray-200"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-grow">
                <label
                  htmlFor={`translation-${translationIndex}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Translation
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                />
              </div>
              <div className="flex-shrink-0 w-48 relative">
                <label
                  htmlFor={`language-${translationIndex}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Language
                </label>
                <div className="relative">
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
                    className="w-full pl-12 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 appearance-none"
                    required
                  >
                    <option value="">Select</option>
                    {languages.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  {translation.language_id && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <FlagIcon
                        code={
                          languages
                            .find((l) => l.id === translation.language_id)
                            ?.iso_2.toUpperCase() || "XX"
                        }
                        size={24}
                      />
                    </div>
                  )}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {translation.examples.map((example, exampleIndex) => (
                <div key={exampleIndex} className="flex items-center space-x-4">
                  <div className="flex-grow">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                  <div className="flex-grow">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addExample(translationIndex)}
                className="mt-2 px-3 py-1 text-sm border border-transparent rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Example
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addTranslation}
          className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Translation
        </button>
        <button
          type="submit"
          className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {initialCard ? "Update Card" : "Add Card"}
        </button>
      </div>
    </form>
  );
}
