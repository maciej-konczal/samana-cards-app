import { NextRequest, NextResponse } from "next/server";
import { extractUnderlinedText } from "@/utils/extractUnderlinedText";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "No image file uploaded" },
      { status: 400 }
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save the buffer to a temporary file
    const os = require("os");
    const path = require("path");
    const fs = require("fs");
    const tempPath = path.join(os.tmpdir(), file.name);
    fs.writeFileSync(tempPath, buffer);

    const underlinedText = await extractUnderlinedText(tempPath);

    // Clean up the temporary file
    fs.unlinkSync(tempPath);

    return NextResponse.json({ underlinedText });
  } catch (error) {
    console.error("Error extracting underlined text:", error);
    return NextResponse.json(
      { error: "Error extracting underlined text" },
      { status: 500 }
    );
  }
}
