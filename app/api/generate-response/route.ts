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
          "You are a friendly Italian sports fan having a conversation in a cafe. Respond in Italian.",
      },
      { role: "user", content: `Article analysis: ${analysis}` },
      ...conversationHistory,
      { role: "user", content: userInput },
    ];
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
    });
    return NextResponse.json({ response: response.choices[0].message.content });
  } catch (error) {
    return NextResponse.json(
      { error: "Error generating response" },
      { status: 500 }
    );
  }
}
