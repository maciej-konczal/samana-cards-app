import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

export async function extractUnderlinedText(
  imagePath: string
): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1000,
    system:
      "You are the image analyzer. Your task is to identify underlined phrases in the text in the uploaded picture. The phrase is underlined only when the line is exactly under the phrase. The specific word should appear in the phrase only if it is explicitly underlined.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: 'Please examine the image and list all phrases that are underlined. For each underlined phrase you identify: 1/ Write out the phrase exactly as it appears. 2/ Provide a brief snippet of the surrounding text for context. 3/ List the phrases in the order they appear in the image, from the top to the bottom in JSON format (example "[{"phrase":"xxx","context":"yyy"]"). Return only JSON.',
          },
        ],
      },
    ],
  });

  return response.content[0].text;
}
