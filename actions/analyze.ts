"use server";
import { SYSTEM_PROMPT, USER_PROMPT } from "@/lib/ const";
import { errorSchema, PSACardSchema } from "@/lib/schemas";
import { google } from "@ai-sdk/google";
import { createStreamableValue } from "@ai-sdk/rsc";
import { streamObject } from "ai";

export async function analyzeCard(formData: FormData) {
  const file = formData.get("file") as File;

  if (!file) {
    return { error: "No file provided" };
  }

  const stream = createStreamableValue();

  // Convert file to base64 for AI processing
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  const mimeType = file.type;

  (async () => {
    const { partialObjectStream } = streamObject({
      model: google("gemini-2.5-flash"),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: USER_PROMPT,
            },
            {
              type: "image",
              image: `data:${mimeType};base64,${base64}`,
            },
          ],
        },
      ],
      schema: PSACardSchema.or(errorSchema),
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}
