import { NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";

// Initialize the ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY as string,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    // Generate audio
    const audioStream = await elevenlabs.generate({
      text: text,
      voice: "Rachel",
      model_id: "eleven_multilingual_v2",
    });

    // Convert the Readable stream to a Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Convert audio buffer to base64
    const base64Audio = audioBuffer.toString("base64");

    return NextResponse.json({ audio: base64Audio });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json(
      { error: "Error generating speech" },
      { status: 500 }
    );
  }
}
