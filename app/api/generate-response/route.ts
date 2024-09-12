import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { analysis, conversationHistory, userInput } = await request.json();
    const messages = [
      {
        role: "system",
        content:
          "You are a friendly Italian sports fan having a conversation in a cafe. Respond in Italian, followed by an English translation. Format your response as 'Italian: [Italian response] English: [English translation]'",
      },
      { role: "user", content: `Article analysis: ${analysis}` },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content:
          msg.role === "assistant"
            ? msg.content.split("English:")[0].trim()
            : msg.content,
      })),
      { role: "user", content: userInput },
    ];
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
    });
    const fullResponse = response.choices[0].message.content;
    const [italian, english] = fullResponse
      .split("English:")
      .map((str) => str.trim());
    return NextResponse.json({
      italian: italian.replace("Italian:", "").trim(),
      english: english,
    });
  } catch (error) {
    console.error("Error generating response:", error);
    return NextResponse.json(
      { error: "Error generating response" },
      { status: 500 }
    );
  }
}
