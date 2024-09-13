"use client";

import React, { useState } from "react";
import { FlagIcon } from "react-flag-kit";

interface Example {
  id: string;
  text: string;
  translation: string;
}

interface Translation {
  id: string;
  text: string;
  language_id: string;
  examples: Example[];
}

interface CardProps {
  card: {
    id: string;
    text: string;
    language_id: string;
    translations: Translation[];
  };
  languageMap: {
    [key: string]: { name: string; iso_2: string };
  };
  onEdit: (card: CardProps["card"]) => void;
  onDelete: (cardId: string) => void;
}

export default function Card({
  card,
  languageMap,
  onEdit,
  onDelete,
}: CardProps) {
  const [expandedTranslations, setExpandedTranslations] = useState<string[]>(
    []
  );

  const toggleExpand = (translationId: string) => {
    setExpandedTranslations((prev) =>
      prev.includes(translationId)
        ? prev.filter((id) => id !== translationId)
        : [...prev, translationId]
    );
  };

  const MAX_EXAMPLES = 3;

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">{card.text}</h2>
        <div>
          <button
            onClick={() => onEdit(card)}
            className="text-white hover:text-gray-200 mr-2"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(card.id)}
            className="text-white hover:text-gray-200"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {card.translations.map((translation) => (
          <div key={translation.id} className="p-6">
            <div className="flex items-center mb-4">
              <FlagIcon
                code={
                  languageMap[translation.language_id]?.iso_2.toUpperCase() ||
                  "XX"
                }
                size={24}
                className="mr-3"
              />
              <span className="text-xl text-gray-900">{translation.text}</span>
            </div>
            {translation.examples.length > 0 && (
              <div className="mt-4 pl-9">
                <ul className="space-y-2">
                  {translation.examples
                    .slice(
                      0,
                      expandedTranslations.includes(translation.id)
                        ? undefined
                        : MAX_EXAMPLES
                    )
                    .map((example) => (
                      <li
                        key={example.id}
                        className="bg-gray-50 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-300 relative group"
                      >
                        <p className="text-sm text-gray-800">
                          {example.translation}
                        </p>
                        <div className="absolute left-0 right-0 top-0 transform -translate-y-full bg-gray-800 text-white p-2 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {example.text}
                        </div>
                      </li>
                    ))}
                </ul>
                {translation.examples.length > MAX_EXAMPLES && (
                  <button
                    onClick={() => toggleExpand(translation.id)}
                    className="mt-2 text-sm text-blue-500 hover:text-blue-700 focus:outline-none"
                  >
                    {expandedTranslations.includes(translation.id)
                      ? "Show Less"
                      : "Show More"}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
