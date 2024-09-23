"use client";

import React, { useState } from "react";
import { FlagIcon } from "react-flag-kit";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

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
    [key: string]: { name: string; iso_2: string; flag_emoji: string };
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
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <FlagIcon
              code={
                languageMap[card.language_id]?.flag_emoji.toUpperCase() || "XX"
              }
              size={24}
              className="mr-2"
            />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              {card.text}
            </h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(card)}
              className="text-blue-600 hover:text-blue-800"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(card.id)}
              className="text-red-600 hover:text-red-800"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {card.translations.map((translation) => (
            <div key={translation.id} className="border-t pt-3">
              <div className="flex items-center mb-2">
                <FlagIcon
                  code={
                    languageMap[
                      translation.language_id
                    ]?.flag_emoji.toUpperCase() || "XX"
                  }
                  size={20}
                  className="mr-2"
                />
                <p className="text-base sm:text-lg font-medium text-gray-800">
                  {translation.text}
                </p>
              </div>
              {translation.examples.length > 0 && (
                <div className="ml-6 space-y-2">
                  {translation.examples.map((example) => (
                    <div key={example.id} className="text-sm sm:text-base">
                      <p className="text-gray-600">{example.text}</p>
                      <p className="text-gray-800">{example.translation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
