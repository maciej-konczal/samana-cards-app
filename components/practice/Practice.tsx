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
  translations: { id: string; text: string; language_id: string }[];
}

interface ChainLink {
  question: string;
  answer: string;
  userAnswer: string;
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
    "flashcard" | "multipleChoice" | "chainReaction"
  >("flashcard");
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>(
    []
  );
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isPracticeStarted, setIsPracticeStarted] = useState(false);

  const [chain, setChain] = useState<ChainLink[]>([]);
  const [currentChainIndex, setCurrentChainIndex] = useState(0);
  const [chainInput, setChainInput] = useState("");
  const [isChainComplete, setIsChainComplete] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      if (practiceMode === "multipleChoice") {
        generateMultipleChoiceOptions();
      }
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
    if (selectedCardSets.length === 0) return [];

    const { data, error } = await supabase
      .from("cards")
      .select(
        `
      id, 
      text, 
      translations!inner (id, text, language_id)
    `
      )
      .in("card_set_id", selectedCardSets)
      .eq("translations.language_id", selectedLanguage)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching cards:", error);
      return [];
    } else {
      return data || [];
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
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const fetchedCards = await fetchCards();
      setCards(fetchedCards);

      if (fetchedCards.length === 0) {
        setErrorMessage("No cards available for the selected sets.");
        return;
      }

      if (practiceMode === "multipleChoice" && fetchedCards.length < 4) {
        setErrorMessage(
          "At least 4 cards are needed for Multiple Choice mode."
        );
        return;
      }

      if (practiceMode === "chainReaction" && fetchedCards.length < 5) {
        setErrorMessage("At least 5 cards are needed for Chain Reaction mode.");
        return;
      }

      setIsPracticeStarted(true);
      setCurrentCardIndex(0);
      if (practiceMode === "chainReaction") {
        startChainReaction();
      }
    } catch (error) {
      console.error("Error starting practice:", error);
      setErrorMessage(
        "An error occurred while starting the practice. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      setIsAnswerRevealed(true);
    }
  };

  const handleFlashcardResult = (result: boolean) => {
    const currentCard = cards[currentCardIndex];
    const currentTranslation = currentCard.translations[0]; // Assuming we're using the first translation
    savePracticeResult(
      currentCard.id,
      currentTranslation.id,
      currentTranslation.language_id,
      result
    );
    nextCard();
  };

  const nextCard = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % cards.length);
    setIsFlipped(false);
    setIsAnswerRevealed(false);
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

  const savePracticeResult = async (
    cardId: string,
    translationId: string,
    languageId: string,
    result: boolean
  ) => {
    const { error } = await supabase.from("practice_stats").insert({
      card_id: cardId,
      translation_id: translationId,
      language_id: languageId,
      result: result,
      practice_mode: practiceMode,
    });

    if (error) {
      console.error("Error saving practice result:", error);
    }
  };

  const checkAnswer = () => {
    setIsAnswerChecked(true);
    const currentCard = cards[currentCardIndex];
    const currentTranslation = currentCard.translations[0];
    const isCorrect = selectedAnswer === currentTranslation.text;
    savePracticeResult(
      currentCard.id,
      currentTranslation.id,
      currentTranslation.language_id,
      isCorrect
    );
  };

  const startChainReaction = () => {
    if (cards.length < 5) {
      console.error("Not enough cards for Chain Reaction");
      return;
    }

    const shuffledCards = [...cards].sort(() => 0.5 - Math.random());
    const newChain: ChainLink[] = shuffledCards
      .slice(0, 5)
      .map((card, index) => ({
        question: card.text,
        answer: card.translations[0].text,
        userAnswer: index === 0 ? card.translations[0].text : "", // Provide the first answer
      }));

    setChain(newChain);
    setCurrentChainIndex(1); // Start at the second item since we provided the first answer
    setIsChainComplete(false);
  };

  const handleChainInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChainInput(e.target.value);
  };

  const submitChainAnswer = () => {
    if (currentChainIndex >= chain.length) return;

    const updatedChain = [...chain];
    updatedChain[currentChainIndex].userAnswer = chainInput;
    setChain(updatedChain);
    setChainInput("");

    const currentCard = cards[currentChainIndex];
    const currentTranslation = currentCard.translations[0];
    const isCorrect =
      chainInput.toLowerCase().trim() ===
      chain[currentChainIndex].answer.toLowerCase().trim();
    savePracticeResult(
      currentCard.id,
      currentTranslation.id,
      currentTranslation.language_id,
      isCorrect
    );

    if (currentChainIndex === chain.length - 1) {
      setIsChainComplete(true);
    } else {
      setCurrentChainIndex(currentChainIndex + 1);
    }
  };

  const renderCard = () => {
    if (cards.length === 0)
      return (
        <div className="text-center text-gray-600 text-lg">
          No cards to practice
        </div>
      );

    const card = cards[currentCardIndex];

    switch (practiceMode) {
      case "flashcard":
        return (
          <div className="max-w-2xl mx-auto">
            <div
              className="bg-white p-8 rounded-lg shadow-lg mb-6 cursor-pointer transition-all duration-300 hover:shadow-xl"
              onClick={flipCard}
            >
              <div
                className={`text-2xl font-semibold ${
                  isFlipped ? "text-blue-600" : "text-gray-800"
                }`}
              >
                {isFlipped ? card.translations[0].text : card.text}
              </div>
            </div>
            {isAnswerRevealed && (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleFlashcardResult(true)}
                  className="px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                  I knew it
                </button>
                <button
                  onClick={() => handleFlashcardResult(false)}
                  className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                  I didn't know it
                </button>
              </div>
            )}
          </div>
        );

      case "multipleChoice":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-lg mb-6">
              <div className="text-2xl font-semibold text-gray-800 mb-6">
                {card.text}
              </div>
              <div className="space-y-3">
                {multipleChoiceOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelection(option)}
                    className={`w-full p-4 rounded-lg text-lg font-medium transition-all duration-300 ${
                      selectedAnswer === option
                        ? isAnswerChecked
                          ? option === card.translations[0].text
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                          : "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
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
                  className="mt-6 w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={!selectedAnswer}
                >
                  Check Answer
                </button>
              )}
            </div>
            {isAnswerChecked && (
              <button
                onClick={nextCard}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Next Card
              </button>
            )}
          </div>
        );

      case "chainReaction":
        return (
          <div className="max-w-3xl mx-auto">
            {chain.length === 0 ? (
              <button
                onClick={startChainReaction}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Start Chain Reaction
              </button>
            ) : (
              <div className="space-y-6">
                {chain.map((link, index) => (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-lg shadow-lg"
                  >
                    <p className="text-xl font-semibold text-gray-800 mb-4">
                      {link.question}
                    </p>
                    {index < currentChainIndex && (
                      <p
                        className={`mt-2 text-lg ${
                          link.userAnswer === link.answer
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        Your answer: {link.userAnswer}
                      </p>
                    )}
                    {index === currentChainIndex && !isChainComplete && (
                      <div className="mt-4">
                        <input
                          type="text"
                          value={chainInput}
                          onChange={handleChainInput}
                          className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Your answer"
                        />
                        <button
                          onClick={submitChainAnswer}
                          className="mt-4 w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                          Submit
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {isChainComplete && (
                  <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">
                      Chain Complete!
                    </h3>
                    <p className="text-lg mb-4">
                      Correct Answers:{" "}
                      {
                        chain.filter((link) => link.userAnswer === link.answer)
                          .length
                      }{" "}
                      / {chain.length}
                    </p>
                    <button
                      onClick={startChainReaction}
                      className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      Start New Chain
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderPractice = () => {
    if (isLoading) {
      return (
        <div className="text-center">
          <p className="text-lg mb-4">Loading cards...</p>
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{errorMessage}</p>
          <button
            onClick={() => setIsPracticeStarted(false)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Back to Setup
          </button>
        </div>
      );
    }

    return (
      <>
        {renderCard()}
        <div className="mt-8 text-center text-gray-600">
          Card {currentCardIndex + 1} of {cards.length}
        </div>
      </>
    );
  };

  if (!isPracticeStarted) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          Practice Setup
        </h1>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">
            Select Language
          </h2>
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageSelection(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <h2 className="text-xl font-semibold mb-2 text-gray-700">
              Select Card Sets
            </h2>
            {cardSets.length === 0 ? (
              <p className="text-gray-600">
                No card sets available for the selected language.
              </p>
            ) : (
              <div className="space-y-2">
                {cardSets.map((set) => (
                  <label
                    key={set.id}
                    className="flex items-center space-x-2 p-2 bg-gray-100 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCardSets.includes(set.id)}
                      onChange={() => handleCardSetSelection(set.id)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="text-gray-800">{set.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">
            Select Practice Mode
          </h2>
          <select
            value={practiceMode}
            onChange={(e) =>
              setPracticeMode(
                e.target.value as
                  | "flashcard"
                  | "multipleChoice"
                  | "chainReaction"
              )
            }
            className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="flashcard">Flashcard</option>
            <option value="multipleChoice">
              Multiple Choice (requires at least 4 cards)
            </option>
            <option value="chainReaction">
              Chain Reaction (requires at least 5 cards)
            </option>
          </select>
        </div>

        <button
          onClick={startPractice}
          disabled={selectedCardSets.length === 0 || isLoading}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Loading..." : "Start Practice"}
        </button>

        {errorMessage && (
          <p className="mt-4 text-red-500 text-center">{errorMessage}</p>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Practice
      </h1>
      {renderPractice()}
    </div>
  );
}
