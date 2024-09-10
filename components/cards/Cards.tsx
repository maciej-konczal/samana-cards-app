"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Card from "./Card";
import BulkCardImport from "./BulkCardImport";
import ExtractUnderlinedText from "./ExtractUnderlinedText";
import AddCardForm from "./AddCardForm";
import { toast } from "react-toastify";

interface UnderlinedText {
  phrase: string;
  context: string;
}

interface NewCard {
  text: string;
  translations: { text: string; language_id: string }[];
}

export default function Cards({ card_set_id }: { card_set_id: string }) {
  const [cards, setCards] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedTexts, setExtractedTexts] = useState<UnderlinedText[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [activeView, setActiveView] = useState<
    "extract" | "add" | "bulk" | null
  >("add");

  const supabase = createClient();

  useEffect(() => {
    fetchCards();
    fetchLanguages();
  }, []);

  const fetchCards = async () => {
    const { data: cardsData } = await supabase
      .from("cards")
      .select(`id, text, translations (id, text, language_id)`)
      .eq("card_set_id", card_set_id);
    setCards(cardsData || []);
  };

  const fetchLanguages = async () => {
    const { data: languagesData } = await supabase
      .from("languages")
      .select(`id, name, iso_2`);
    setLanguages(languagesData || []);
  };

  const languageMap = languages.reduce((acc, lang) => {
    acc[lang.id] = { name: lang.name, iso_2: lang.iso_2 };
    return acc;
  }, {});

  const handleExtractedText = (texts: UnderlinedText[]) => {
    setExtractedTexts(texts);
    if (texts.length > 0) {
      setSelectedText(texts[0].phrase);
    }
  };

  const handleAddCard = async (newCard: NewCard) => {
    try {
      const { data, error } = await supabase
        .from("cards")
        .insert({ text: newCard.text, card_set_id })
        .select()
        .single();

      if (error) throw error;

      const translationPromises = newCard.translations.map((translation) =>
        supabase
          .from("translations")
          .insert({ card_id: data.id, ...translation })
      );

      await Promise.all(translationPromises);

      toast.success("Card added successfully");
      fetchCards();
    } catch (error) {
      console.error("Error adding card:", error);
      toast.error("Failed to add card");
    }
  };

  const handleBulkImport = async (importedCards) => {
    setIsLoading(true);

    for (const card of importedCards) {
      const { data: cardData, error: cardError } = await supabase
        .from("cards")
        .insert({ text: card.text, card_set_id: card_set_id })
        .select()
        .single();

      if (cardError) {
        toast.error(`Error adding card: ${card.text}`);
        continue;
      }

      if (cardData) {
        const translationsToInsert = card.translations.map((t) => ({
          ...t,
          card_id: cardData.id,
        }));

        const { error: translationsError } = await supabase
          .from("translations")
          .insert(translationsToInsert);

        if (translationsError) {
          toast.error(`Error adding translations for card: ${card.text}`);
        }
      }
    }

    setIsLoading(false);
    fetchCards(); // Refresh the cards list
    toast.success("Bulk import completed");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      <div className="flex justify-center space-x-6 mb-8">
        <button
          onClick={() => setActiveView("extract")}
          className={`px-6 py-3 rounded-lg font-semibold text-lg shadow-md transition-colors duration-200 ${
            activeView === "extract"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          Extract Words
        </button>
        <button
          onClick={() => setActiveView("add")}
          className={`px-6 py-3 rounded-lg font-semibold text-lg shadow-md transition-colors duration-200 ${
            activeView === "add"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          Add Cards
        </button>
        <button
          onClick={() => setActiveView("bulk")}
          className={`px-6 py-3 rounded-lg font-semibold text-lg shadow-md transition-colors duration-200 ${
            activeView === "bulk"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          Bulk Import
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {activeView === "extract" && (
          <div className="space-y-8">
            <ExtractUnderlinedText onExtract={handleExtractedText} />
            {extractedTexts.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Extracted Texts:</h3>
                <ul className="space-y-4">
                  {extractedTexts.map((text, index) => (
                    <li key={index} className="bg-white p-4 rounded-lg shadow">
                      <strong className="text-lg text-gray-800">
                        {text.phrase}
                      </strong>
                      <p className="text-gray-600 mt-2">
                        Context: {text.context}
                      </p>
                      <button
                        onClick={() => setSelectedText(text.phrase)}
                        className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                      >
                        Use as Card Text
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <AddCardForm
              languages={languages}
              onAddCard={handleAddCard}
              initialText={selectedText}
            />
          </div>
        )}

        {activeView === "add" && (
          <AddCardForm
            languages={languages}
            onAddCard={handleAddCard}
            initialText={selectedText}
          />
        )}

        {activeView === "bulk" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Bulk Import Cards</h2>
            <BulkCardImport languages={languages} onImport={handleBulkImport} />
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Your Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Card key={card.id} card={card} languageMap={languageMap} />
          ))}
        </div>
      </div>
    </div>
  );
}
