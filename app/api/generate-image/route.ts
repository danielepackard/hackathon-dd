import { NextRequest, NextResponse } from "next/server";
import * as fal from "@fal-ai/serverless-client";

// Configure fal.ai with API key
fal.config({
  credentials: process.env.FAL_KEY,
});

const BASE_PROMPT =
  "Fantasy RPG illustration, Dungeons & Dragons official artwork style, highly detailed digital painting, dramatic cinematic lighting, epic fantasy scene, rich colors, professional concept art quality: ";

// Clean up narration to extract visual scene description
function extractVisualScene(narration: string): string {
  // Remove common non-visual phrases
  let cleaned = narration
    .replace(/What do you do\??/gi, "")
    .replace(/What will you do\??/gi, "")
    .replace(/How do you respond\??/gi, "")
    .replace(/Roll for initiative[.!]?/gi, "")
    .replace(/\?+/g, ".")
    .trim();

  // Limit length to avoid overly long prompts
  if (cleaned.length > 400) {
    cleaned = cleaned.substring(0, 400) + "...";
  }

  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const { narratorText } = await request.json();

    if (!narratorText || typeof narratorText !== "string") {
      return NextResponse.json(
        { error: "narratorText is required" },
        { status: 400 }
      );
    }

    const cleanedScene = extractVisualScene(narratorText);
    const fullPrompt = `${BASE_PROMPT}${cleanedScene}`;

    console.log("Generating image with prompt:", fullPrompt);

    // Use fal-ai/flux/dev for high quality image generation
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: fullPrompt,
        image_size: "landscape_16_9",
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
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

