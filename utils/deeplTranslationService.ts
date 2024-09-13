export async function getDeepLTranslationSuggestion(
  text: string,
  targetLang: string
): Promise<string> {
  try {
    const response = await fetch("/api/deepl-translation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, targetLang }),
    });

    if (!response.ok) {
      throw new Error("Translation request failed");
    }

    const data = await response.json();
    return data.translation;
  } catch (error) {
    console.error("Error fetching translation:", error);
    return "";
  }
}
