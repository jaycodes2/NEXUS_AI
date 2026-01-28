import fetch from "node-fetch";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

interface GeminiEmbeddingResponse {
  embedding: {
    values: number[];
  };
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }]
        },
        outputDimensionality: 768
      })
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error("Embedding API failed: " + err);
  }

  const data = await response.json() as GeminiEmbeddingResponse;
  return data.embedding.values;
}
