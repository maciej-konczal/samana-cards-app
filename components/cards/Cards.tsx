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
  const [editingCard, setEditingCard] = useState(null);

  const supabase = createClient();

  useEffect(() => {
    fetchCards();
    fetchLanguages();
  }, []);

  const fetchCards = async () => {
    const { data: cardsData } = await supabase
      .from("cards")
      .select(
        `
      id, 
      text, 
      translations (
        id, 
        text, 
        language_id,
        examples (id, text, translation)
      )
    `
      )
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
      const { data: cardData, error: cardError } = await supabase
        .from("cards")
        .insert({ text: newCard.text, card_set_id })
        .select()
        .single();

      if (cardError) throw cardError;

      for (const translation of newCard.translations) {
        const { data: translationData, error: translationError } =
          await supabase
            .from("translations")
            .insert({
              card_id: cardData.id,
              text: translation.text,
              language_id: translation.language_id,
            })
            .select()
            .single();

        if (translationError) throw translationError;

        const examplePromises = translation.examples.map((example) =>
          supabase.from("examples").insert({
            translation_id: translationData.id,
            card_id: cardData.id,
            text: example.text,
            translation: example.translation,
          })
        );

        await Promise.all(examplePromises);
      }

      toast.success("Card added successfully");
      fetchCards();
    } catch (error) {
      console.error("Error adding card:", error);
      toast.error("Failed to add card");
    }
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
    setActiveView("add");
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      // First, delete all examples associated with the card's translations
      const { error: examplesError } = await supabase
        .from("examples")
        .delete()
        .eq("card_id", cardId);

      if (examplesError) throw examplesError;

      // Then, delete all translations associated with the card
      const { error: translationsError } = await supabase
        .from("translations")
        .delete()
        .eq("card_id", cardId);

      if (translationsError) throw translationsError;

      // Finally, delete the card itself
      const { error: cardError } = await supabase
        .from("cards")
        .delete()
        .eq("id", cardId);

      if (cardError) throw cardError;

      toast.success("Card deleted successfully");
      fetchCards();
    } catch (error) {
      console.error("Error deleting card:", error);
      toast.error("Failed to delete card");
    }
  };

  const handleUpdateCard = async (updatedCard: NewCard) => {
    try {
      // Update the card text
      const { data: cardData, error: cardError } = await supabase
        .from("cards")
        .update({ text: updatedCard.text })
        .eq("id", updatedCard.id)
        .select()
        .single();

      if (cardError) throw cardError;

      // Fetch existing translations for this card
      const { data: existingTranslations, error: fetchError } = await supabase
        .from("translations")
        .select("id, language_id, text")
        .eq("card_id", updatedCard.id);

      if (fetchError) throw fetchError;

      // Create a map of existing translations for easy lookup
      const existingTranslationMap = new Map(
        existingTranslations.map((t) => [t.language_id, t])
      );

      // Update or insert translations and examples
      for (const translation of updatedCard.translations) {
        const existingTranslation = existingTranslationMap.get(
          translation.language_id
        );

        if (existingTranslation) {
          // Update existing translation if the text has changed
          if (existingTranslation.text !== translation.text) {
            const { error: updateError } = await supabase
              .from("translations")
              .update({ text: translation.text })
              .eq("id", existingTranslation.id);

            if (updateError) throw updateError;
          }

          // Delete existing examples for this translation
          const { error: deleteExamplesError } = await supabase
            .from("examples")
            .delete()
            .eq("translation_id", existingTranslation.id);

          if (deleteExamplesError) throw deleteExamplesError;

          // Insert new examples
          const examplePromises = translation.examples.map((example) =>
            supabase.from("examples").insert({
              translation_id: existingTranslation.id,
              card_id: updatedCard.id,
              text: example.text,
              translation: example.translation,
            })
          );

          await Promise.all(examplePromises);

          // Remove this translation from the map of existing translations
          existingTranslationMap.delete(translation.language_id);
        } else {
          // Insert new translation
          const { data: newTranslation, error: insertError } = await supabase
            .from("translations")
            .insert({
              card_id: updatedCard.id,
              text: translation.text,
              language_id: translation.language_id,
            })
            .select()
            .single();

          if (insertError) throw insertError;

          // Insert new examples
          const examplePromises = translation.examples.map((example) =>
            supabase.from("examples").insert({
              translation_id: newTranslation.id,
              card_id: updatedCard.id,
              text: example.text,
              translation: example.translation,
            })
          );

          await Promise.all(examplePromises);
        }
      }

      // Delete any remaining translations that weren't in the updated data
      for (const [languageId, translation] of existingTranslationMap) {
        const { error: deleteTranslationError } = await supabase
          .from("translations")
          .delete()
          .eq("id", translation.id);

        if (deleteTranslationError) throw deleteTranslationError;
      }

      toast.success("Card updated successfully");
      fetchCards();
      setEditingCard(null);
    } catch (error) {
      console.error("Error updating card:", error);
      toast.error("Failed to update card");
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
            onAddCard={editingCard ? handleUpdateCard : handleAddCard}
            initialCard={editingCard}
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
            <Card
              key={card.id}
              card={card}
              languageMap={languageMap}
              onEdit={handleEditCard}
              onDelete={handleDeleteCard}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
