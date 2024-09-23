"use client";

import { useState, useEffect, useRef } from "react";
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
  language_id: string;
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
  const addCardFormRef = useRef(null);

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
        language_id,
        translations (
          id, 
          text, 
          language_id,
          examples (id, text, translation)
        )
      `
      )
      .eq("card_set_id", card_set_id)
      .order("created_at", { ascending: false }); // Order by creation date, newest first
    setCards(cardsData || []);
  };

  const fetchLanguages = async () => {
    const { data: languagesData } = await supabase
      .from("languages")
      .select(`id, name, iso_2, flag_emoji`);
    setLanguages(languagesData || []);
  };

  const languageMap = languages.reduce((acc, lang) => {
    acc[lang.id] = {
      name: lang.name,
      iso_2: lang.iso_2,
      flag_emoji: lang.flag_emoji,
    };
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
        .insert({
          text: newCard.text,
          card_set_id,
          language_id: newCard.language_id, // Add this line
        })
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
    console.log("card:", JSON.stringify(card));
    // Ensure we're passing the full card object, including the language_id
    setEditingCard({
      id: card.id,
      text: card.text,
      language_id: card.language_id,
      translations: card.translations,
    });
    setActiveView("add");
    setTimeout(() => {
      addCardFormRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
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
      await fetchCards(); // Refetch cards to get the updated order
      setEditingCard(null);
      setActiveView("add"); // Reset to add view
    } catch (error) {
      console.error("Error updating card:", error);
      toast.error("Failed to update card");
    }
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

  const handleBulkImport = async (importedCards) => {
    setIsLoading(true);

    for (const card of importedCards) {
      const sourceLanguage = languages.find(
        (lang) => lang.iso_2 === card.text_language
      );
      if (!sourceLanguage) {
        toast.error(`Invalid source language for card: ${card.text}`);
        continue;
      }

      const { data: cardData, error: cardError } = await supabase
        .from("cards")
        .insert({
          text: card.text,
          card_set_id: card_set_id,
          language_id: sourceLanguage.id, // Use the language_id from the source language
        })
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

  const handleRemoveTranslation = async (translationId: string) => {
    try {
      const { error } = await supabase
        .from("translations")
        .delete()
        .eq("id", translationId);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing translation:", error);
      throw error;
    }
  };

  const handleRemoveExample = async (exampleId: string) => {
    try {
      const { error } = await supabase
        .from("examples")
        .delete()
        .eq("id", exampleId);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing example:", error);
      throw error;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
        <button
          onClick={() => setActiveView("extract")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm sm:text-base shadow-md transition-colors duration-200 ${
            activeView === "extract"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          Extract Words
        </button>
        <button
          onClick={() => setActiveView("add")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm sm:text-base shadow-md transition-colors duration-200 ${
            activeView === "add"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          Add Cards
        </button>
        <button
          onClick={() => setActiveView("bulk")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm sm:text-base shadow-md transition-colors duration-200 ${
            activeView === "bulk"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          Bulk Import
        </button>
      </div>

      <div
        ref={addCardFormRef}
        className="bg-white rounded-lg shadow-md p-4 sm:p-6"
      >
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
            onRemoveTranslation={handleRemoveTranslation}
            onRemoveExample={handleRemoveExample}
            key={editingCard ? editingCard.id : "add"}
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
        <h2 className="text-xl sm:text-2xl font-semibold mb-6">Your Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
