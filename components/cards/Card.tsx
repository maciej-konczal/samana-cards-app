"use client";

import { useState } from "react";

export default function Card({
  card,
  languageMap,
}: {
  card: any;
  languageMap: Record<string, { name: string; iso_2: string }>;
}) {
  const [unblurredTranslations, setUnblurredTranslations] = useState<string[]>(
    []
  );

  const toggleBlur = (translationId: string) => {
    setUnblurredTranslations((prev) =>
      prev.includes(translationId)
        ? prev.filter((id) => id !== translationId)
        : [...prev, translationId]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <h3 className="text-xl font-semibold">{card.text}</h3>
      </div>
      <div className="p-4">
        <h4 className="text-lg font-medium mb-3 text-gray-700">
          {/* Translations: */}
        </h4>
        <ul className="space-y-3">
          {card.translations?.map((translation: any) => {
            const language = languageMap?.[translation.language_id];
            const isUnblurred = unblurredTranslations.includes(translation.id);
            return (
              <li
                key={translation.id}
                className="flex items-center cursor-pointer"
                onClick={() => toggleBlur(translation.id)}
              >
                <span className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full mr-3 text-sm font-medium text-gray-600">
                  {language?.iso_2.toUpperCase()}
                </span>
                <div>
                  {/* <span className="text-sm text-gray-500">
                    {language?.name}:
                  </span> */}
                  <p
                    className={`text-gray-800 ${isUnblurred ? "" : "blur-sm"}`}
                  >
                    {translation.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
