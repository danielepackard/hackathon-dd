import { NextRequest, NextResponse } from "next/server";
import * as fal from "@fal-ai/serverless-client";

// Configure fal.ai with API key
fal.config({
  credentials: process.env.FAL_KEY,
});

const BASE_PROMPT =
  "Fantasy RPG illustration, Dungeons & Dragons style, mystical atmosphere, detailed digital painting, dramatic lighting, epic scene: ";

export async function POST(request: NextRequest) {
  try {
    const { narratorText } = await request.json();

    if (!narratorText || typeof narratorText !== "string") {
      return NextResponse.json(
        { error: "narratorText is required" },
        { status: 400 }
      );
    }

    const fullPrompt = `${BASE_PROMPT}${narratorText}`;

    // Use fal-ai/nano-banana model for fast image generation
    const result = await fal.subscribe("fal-ai/fast-sdxl", {
      input: {
        prompt: fullPrompt,
        image_size: "landscape_16_9",
        num_inference_steps: 4,
        num_images: 1,
      },
      logs: false,
    });

    // Extract the image URL from the result
    const imageUrl = (result as any)?.images?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageUrl, prompt: fullPrompt });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}

