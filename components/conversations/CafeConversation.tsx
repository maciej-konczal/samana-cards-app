"use client";

import React, { useState, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  audio?: string;
}

export default function CafeConversation() {
  const [articleContent, setArticleContent] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const analyzeArticle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/analyze-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleContent }),
      });
      const data = await response.json();
      setAnalysis(data.analysis);
      await generateResponse(
        "Start the conversation about the article.",
        data.analysis
      );
    } catch (error) {
      console.error("Error analyzing article:", error);
    }
    setIsLoading(false);
  };

  const generateResponse = async (input: string, initialAnalysis?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: initialAnalysis || analysis,
          conversationHistory,
          userInput: input,
        }),
      });
      const data = await response.json();
      const audioData = await generateSpeech(data.response);
      const newMessage: Message = {
        role: "assistant",
        content: data.response,
        audio: audioData,
      };
      setConversationHistory((prev) => [...prev, newMessage]);
      playAudio(audioData);
    } catch (error) {
      console.error("Error generating response:", error);
    }
    setIsLoading(false);
  };

  const generateSpeech = async (text: string): Promise<string> => {
    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      return data.audio;
    } catch (error) {
      console.error("Error generating speech:", error);
      return "";
    }
  };

  const playAudio = (audioData: string) => {
    if (audioRef.current) {
      audioRef.current.src = `data:audio/mp3;base64,${audioData}`;
      audioRef.current.play();
    }
  };

  const handleUserInput = async () => {
    if (userInput.trim()) {
      const newMessage: Message = { role: "user", content: userInput };
      setConversationHistory((prev) => [...prev, newMessage]);
      setUserInput("");
      await generateResponse(userInput);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Cafe Conversation in Italian</h1>
      <textarea
        className="w-full p-2 border rounded mb-4"
        rows={4}
        value={articleContent}
        onChange={(e) => setArticleContent(e.target.value)}
        placeholder="Paste Tuttosport article here"
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={analyzeArticle}
        disabled={isLoading || !articleContent.trim()}
      >
        Start Conversation
      </button>
      <div className="mt-4">
        {conversationHistory.map((message, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded ${
              message.role === "user" ? "bg-gray-200" : "bg-blue-200"
            }`}
          >
            {message.content}
            {message.role === "assistant" && message.audio && (
              <button
                className="ml-2 bg-green-500 text-white px-2 py-1 rounded text-sm"
                onClick={() => playAudio(message.audio!)}
              >
                Play Audio
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex">
        <input
          className="flex-grow p-2 border rounded-l"
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your response..."
          onKeyPress={(e) => e.key === "Enter" && handleUserInput()}
        />
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-r"
          onClick={handleUserInput}
          disabled={isLoading || !userInput.trim()}
        >
          Send
        </button>
      </div>
      {isLoading && <p className="mt-2">Loading...</p>}
      <audio ref={audioRef} />
    </div>
  );
}
