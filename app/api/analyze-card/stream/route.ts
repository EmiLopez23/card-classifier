import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { streamAnalyzerGraph } from "@/lib/agent";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Streaming API endpoint for card analysis
 * Returns Server-Sent Events (SSE) with intermediate results
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const hint = formData.get("hint") as string | null;

    if (!file) {
      return new Response(
        JSON.stringify({
          error: "image_not_supported",
          reason: "No file provided",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate file type
    const validTypes = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];

    if (!validTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error: "image_not_supported",
          reason:
            "Invalid file type. Only images (PNG, JPG, GIF, WEBP) and PDFs are supported.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare data
    const cardId = randomUUID();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream agent updates
          for await (const update of streamAnalyzerGraph(
            base64,
            file.type,
            cardId,
            buffer,
            hint || undefined
          )) {
            // Send SSE formatted message
            const data = `data: ${JSON.stringify(update)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          // Send completion message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
          controller.close();
        } catch (error: any) {
          console.error("Streaming error:", error);
          const errorData = {
            type: "error",
            error: "image_not_supported",
            reason: error?.message || "Unknown error",
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable buffering in nginx
      },
    });
  } catch (error: any) {
    console.error("Request processing error:", error);
    return new Response(
      JSON.stringify({
        error: "image_not_supported",
        reason: error?.message || "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
