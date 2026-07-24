import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isEditor } from "@/lib/rbac";

const bodySchema = z.object({
  prompt: z.string().trim().min(8).max(800),
});

const GEMINI_MODEL =
  process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image-preview";

type GeminiPart = {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
  inline_data?: { mime_type?: string; data?: string };
};

export async function POST(request: Request) {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI cover generation is not configured. Add GEMINI_API_KEY to the server environment.",
      },
      { status: 503 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a longer scene description (at least 8 characters)." },
      { status: 400 },
    );
  }

  const prompt = [
    "Create a high-resolution editorial photography cover image for a nature-forward therapy essay.",
    "Aspect ratio 16:9, landscape orientation, photorealistic, no text, no logos, no watermarks, no people faces.",
    "Mood: calm, grounded, botanical, soft natural light.",
    `Scene: ${parsed.data.prompt}`,
  ].join(" ");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: "16:9",
          },
        },
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the Gemini image API. Try again shortly." },
      { status: 502 },
    );
  }

  const payload = (await geminiRes.json().catch(() => null)) as {
    error?: { message?: string };
    candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  } | null;

  if (!geminiRes.ok) {
    return NextResponse.json(
      {
        error:
          payload?.error?.message ??
          "Gemini could not generate an image for that prompt.",
      },
      { status: geminiRes.status >= 400 ? geminiRes.status : 502 },
    );
  }

  const parts = payload?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find(
    (part) => part.inlineData?.data || part.inline_data?.data,
  );

  const mime =
    imagePart?.inlineData?.mimeType ||
    imagePart?.inline_data?.mime_type ||
    "image/png";
  const data = imagePart?.inlineData?.data || imagePart?.inline_data?.data;

  if (!data) {
    return NextResponse.json(
      {
        error:
          "No image was returned. Try a more visual nature scene description.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    imageDataUrl: `data:${mime};base64,${data}`,
    model: GEMINI_MODEL,
  });
}
