import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { articleContent } = await request.json();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that analyzes Italian sports articles.",
        },
        {
          role: "user",
          content: `Analyze this Italian sports article and extract 3-5 key points for discussion:\n\n${articleContent}`,
        },
      ],
    });
    return NextResponse.json({ analysis: response.choices[0].message.content });
  } catch (error) {
    return NextResponse.json(
      { error: "Error analyzing article" },
      { status: 500 }
    );
  }
}
