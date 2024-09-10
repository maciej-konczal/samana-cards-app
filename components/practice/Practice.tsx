"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface Language {
  id: string;
  name: string;
}

interface CardSet {
  id: string;
  name: string;
}

interface Card {
  id: string;
  text: string;
  translations: { text: string; language_id: string }[];
}

export default function Practice() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [cardSets, setCardSets] = useState<CardSet[]>([]);
  const [selectedCardSets, setSelectedCardSets] = useState<string[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [practiceMode, setPracticeMode] = useState<
    "flashcard" | "multipleChoice"
  >("flashcard");
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>(
    []
  );
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isPracticeStarted, setIsPracticeStarted] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (selectedLanguage) {
      fetchCardSets();
    }
  }, [selectedLanguage]);

  useEffect(() => {
    if (isPracticeStarted && cards.length > 0) {
      generateMultipleChoiceOptions();
    }
  }, [currentCardIndex, practiceMode, cards, isPracticeStarted]);

  const fetchLanguages = async () => {
    const { data, error } = await supabase
      .from("languages")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Error fetching languages:", error);
    } else {
      setLanguages(data || []);
    }
  };

  const fetchCardSets = async () => {
    const { data, error } = await supabase
      .from("card_sets")
      .select(
        `
        id, 
        name,
        cards!inner (
          id,
          translations!inner (language_id)
        )
      `
      )
      .eq("cards.translations.language_id", selectedLanguage)
      .order("name");

    if (error) {
      console.error("Error fetching card sets:", error);
    } else {
      setCardSets(data || []);
    }
  };

  const fetchCards = async () => {
    if (selectedCardSets.length === 0) return;

    const { data, error } = await supabase
      .from("cards")
      .select(`id, text, translations!inner (text, language_id)`)
      .in("card_set_id", selectedCardSets)
      .eq("translations.language_id", selectedLanguage)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching cards:", error);
    } else {
      setCards(data || []);
    }
  };

  const handleLanguageSelection = (languageId: string) => {
    setSelectedLanguage(languageId);
    setSelectedCardSets([]);
  };

  const handleCardSetSelection = (cardSetId: string) => {
    setSelectedCardSets((prev) =>
      prev.includes(cardSetId)
        ? prev.filter((id) => id !== cardSetId)
        : [...prev, cardSetId]
    );
  };

  const startPractice = async () => {
    await fetchCards();
    setIsPracticeStarted(true);
    setCurrentCardIndex(0);
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % cards.length);
    setIsFlipped(false);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
  };

  const generateMultipleChoiceOptions = () => {
    if (cards.length < 4) {
      console.error("Not enough cards for multiple choice");
      return;
    }

    const currentCard = cards[currentCardIndex];
    const correctAnswer = currentCard.translations[0].text; // Assuming we're using the first translation

    // Get 3 random incorrect answers
    const incorrectAnswers = cards
      .filter((card, index) => index !== currentCardIndex)
      .map((card) => card.translations[0].text)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // Combine correct and incorrect answers, then shuffle
    const options = [correctAnswer, ...incorrectAnswers].sort(
      () => 0.5 - Math.random()
    );

    setMultipleChoiceOptions(options);
  };

  const handleAnswerSelection = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const checkAnswer = () => {
    setIsAnswerChecked(true);
  };

  const renderCard = () => {
    if (cards.length === 0) return <div>No cards to practice</div>;

    const card = cards[currentCardIndex];

    switch (practiceMode) {
      case "flashcard":
        return (
          <div className="bg-white p-6 rounded-lg shadow-lg" onClick={flipCard}>
            {isFlipped ? (
              <div>
                {card.translations.map((translation, index) => (
                  <div key={index}>{translation.text}</div>
                ))}
              </div>
            ) : (
              <div>{card.text}</div>
            )}
          </div>
        );
      case "multipleChoice":
        return (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="mb-4">{card.text}</div>
            <div className="space-y-2">
              {multipleChoiceOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelection(option)}
                  className={`w-full p-2 rounded ${
                    selectedAnswer === option
                      ? isAnswerChecked
                        ? option === card.translations[0].text
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                        : "bg-blue-500 text-white"
                      : "bg-gray-200"
                  } ${
                    isAnswerChecked && option === card.translations[0].text
                      ? "bg-green-500 text-white"
                      : ""
                  }`}
                  disabled={isAnswerChecked}
                >
                  {option}
                </button>
              ))}
            </div>
            {!isAnswerChecked && (
              <button
                onClick={checkAnswer}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                disabled={!selectedAnswer}
              >
                Check Answer
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (!isPracticeStarted) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">
          Select Language and Card Sets to Practice
        </h1>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Select Language</h2>
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageSelection(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select a language</option>
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {selectedLanguage && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Select Card Sets</h2>
            {cardSets.length === 0 ? (
              <p>No card sets available for the selected language.</p>
            ) : (
              <div className="space-y-2">
                {cardSets.map((set) => (
                  <label key={set.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCardSets.includes(set.id)}
                      onChange={() => handleCardSetSelection(set.id)}
                      className="form-checkbox"
                    />
                    <span>{set.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={startPractice}
          disabled={selectedCardSets.length === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          Start Practice
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Practice</h1>
      <div className="mb-4">
        <select
          value={practiceMode}
          onChange={(e) =>
            setPracticeMode(e.target.value as "flashcard" | "multipleChoice")
          }
          className="p-2 border rounded"
        >
          <option value="flashcard">Flashcard</option>
          <option value="multipleChoice">Multiple Choice</option>
        </select>
      </div>
      {renderCard()}
      <button
        onClick={nextCard}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Next Card
      </button>
    </div>
  );
}
