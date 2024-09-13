import { NextResponse } from "next/server";

const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

interface DeepLTranslationResponse {
  translations: {
    detected_source_language: string;
    text: string;
  }[];
}

export async function POST(request: Request) {
  const { text, targetLang } = await request.json();

  if (!text || !targetLang) {
    return NextResponse.json(
      { message: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(DEEPL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "YourApp/1.0.0",
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLang.toUpperCase(),
      }),
    });

    if (!response.ok) {
      throw new Error("Translation request failed");
    }

    const data: DeepLTranslationResponse = await response.json();
    return NextResponse.json({ translation: data.translations[0].text });
  } catch (error) {
    console.error("Error fetching translation:", error);
    return NextResponse.json(
      { message: "Error fetching translation" },
      { status: 500 }
    );
  }
}
