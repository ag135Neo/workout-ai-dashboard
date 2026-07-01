import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { inferSessionMuscle, normalizeSession } from "@/lib/workout";

export const runtime = "nodejs";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["date", "muscle", "type", "satisfaction", "notes", "exercises"],
  properties: {
    date: { type: "string", description: "YYYY-MM-DD. If no date is visible, use the provided fallback date." },
    muscle: { type: "string", description: "Session muscle groups, comma-separated." },
    type: { type: "string", enum: ["Coach", "Self", "Unknown"] },
    satisfaction: { anyOf: [{ type: "number", minimum: 0, maximum: 100 }, { type: "null" }] },
    notes: { type: "string" },
    exercises: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "sets"],
        properties: {
          name: { type: "string" },
          sets: {
            type: "array",
            description: "Each set as [reps, weight]. Keep original notations like 10x2, Bar, '-', 15(7+8).",
            items: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: { type: "string" },
            },
          },
        },
      },
    },
  },
};

function fallbackSession(typeHint: string, dateHint: string) {
  const exercises = [
    { name: "Lat Pulldown (Mag Grip)", sets: [["12", "9"], ["10", "10"], ["8", "11"]] },
    { name: "T-Bar (Wide)", sets: [["10", "35"], ["8", "40"], ["5", "45"]] },
    { name: "Bicep Curl", sets: [["15", "8"], ["15", "10"], ["12", "12"]] },
  ];
  return normalizeSession({
    date: dateHint,
    muscle: inferSessionMuscle(exercises.map((e) => e.name)),
    type: typeHint || "Self",
    satisfaction: 70,
    notes: "Demo extraction because OPENAI_API_KEY is not configured.",
    exercises,
  });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const image = formData.get("image");
  const typeHint = String(formData.get("type") || "Self");
  const dateHint = String(formData.get("date") || new Date().toISOString().slice(0, 10));
  const notesHint = String(formData.get("notes") || "");

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Upload an image file named image." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      session: fallbackSession(typeHint, dateHint),
      warning: "OPENAI_API_KEY is missing, so this is a demo extraction.",
    });
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const dataUrl = `data:${image.type || "image/jpeg"};base64,${buffer.toString("base64")}`;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `
You are extracting a gym workout log from a photo. Return only JSON matching the schema.

Rules:
- Preserve exercise names as written when readable, but fix obvious abbreviations: Leg Extn can stay Leg Extn, DB is okay, M/C means machine.
- Convert each exercise's sets into [reps, weight] string pairs.
- Keep weights as originally written, including x2 for dumbbells, Bar, blank, '-' and combined notes like 15(7+8).
- If something is illegible, include the best guess and put the uncertainty in notes.
- If the image has no explicit date, use fallback date ${dateHint}.
- If session type is not visible, use this hint: ${typeHint}.
- If satisfaction is not visible, use null.
- Extra note from user: ${notesHint || "none"}.
`;

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: dataUrl, detail: "high" },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "workout_session",
          schema,
          strict: false,
        },
      },
    } as any);

    const parsed = JSON.parse(response.output_text || "{}");
    const session = normalizeSession({ ...parsed, type: parsed.type === "Unknown" ? typeHint : parsed.type });
    return NextResponse.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown extraction error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
