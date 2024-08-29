"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Card from "./Card";
import BulkCardImport from "./BulkCardImport";
import { toast } from "react-toastify";

interface Translation {
  text: string;
  language_id: string;
}

interface NewCard {
  text: string;
  translations: Translation[];
}

export default function Cards({ card_set_id }: { card_set_id: string }) {
  const [cards, setCards] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [newCard, setNewCard] = useState<NewCard>({
    text: "",
    translations: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const fetchCards = async () => {
    const { data: cardsData } = await supabase
      .from("cards")
      .select(`id, text, translations (id, text, language_id)`)
      .eq("card_set", card_set_id);
    setCards(cardsData || []);
  };

  const fetchLanguages = async () => {
    const { data: languagesData } = await supabase
      .from("languages")
      .select(`id, name, iso_2`);
    setLanguages(languagesData || []);
  };

  useEffect(() => {
    fetchCards();
    fetchLanguages();
  }, []);

  const languageMap = languages.reduce((acc, lang) => {
    acc[lang.id] = { name: lang.name, iso_2: lang.iso_2 };
    return acc;
  }, {});

  const handleAddCard = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { data: cardData, error: cardError } = await supabase
      .from("cards")
      .insert({ text: newCard.text, card_set: card_set_id })
      .select()
      .single();

    if (cardError) {
      toast.error("Error adding card: " + cardError.message);
      setIsLoading(false);
      return;
    }

    if (cardData) {
      const translationsToInsert = newCard.translations.map((t) => ({
        ...t,
        card_id: cardData.id,
      }));

      const { error: translationsError } = await supabase
        .from("translations")
        .insert(translationsToInsert);

      if (translationsError) {
        toast.error("Error adding translations: " + translationsError.message);
      } else {
        toast.success("Card and translations added successfully!");
        setNewCard({ text: "", translations: [] });
        fetchCards(); // Refresh the cards list
      }
    }

    setIsLoading(false);
  };

  const handleTranslationChange = (
    index: number,
    field: string,
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

  const handleBulkImport = async (importedCards) => {
    setIsLoading(true);

    for (const card of importedCards) {
      const { data: cardData, error: cardError } = await supabase
        .from("cards")
        .insert({ text: card.text, card_set: card_set_id })
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
    <div className="space-y-8">
      <form onSubmit={handleAddCard} className="mb-6 space-y-4">
        <div>
          <input
            type="text"
            value={newCard.text}
            onChange={(e) => setNewCard({ ...newCard, text: e.target.value })}
            placeholder="Enter new card text"
            className="w-full p-2 border rounded"
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
              className="flex-1 p-2 border rounded"
            />
            <select
              value={translation.language_id}
              onChange={(e) =>
                handleTranslationChange(index, "language_id", e.target.value)
              }
              className="p-2 border rounded"
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

      <div className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">Bulk Import Cards</h2>
        <BulkCardImport languages={languages} onImport={handleBulkImport} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Card key={card.id} card={card} languageMap={languageMap} />
        ))}
      </div>
    </div>
  );
}
