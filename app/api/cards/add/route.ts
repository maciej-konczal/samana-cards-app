import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  const { text, card_set_id, languageId, translatedText } =
    await request.json();

  const supabase = createClient();

  // Start a Supabase transaction
  const { data, error } = await supabase.rpc("add_card_with_translation", {
    p_text: text,
    p_card_set_id: card_set_id,
    p_language_id: languageId,
    p_translated_text: translatedText,
  });

  if (error) {
    console.error("Error adding card:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, cardId: data });
}
