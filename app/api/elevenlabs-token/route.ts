import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return handleRequest();
}

export async function POST(request: NextRequest) {
  // POST handler kept for backward compatibility, but variables should be passed to startSession instead
  console.log("[ElevenLabs API] POST request received - note: variables should be passed to startSession, not here");
  return handleRequest();
}

async function handleRequest() {
  try {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;

    if (!apiKey) {
      console.error("[ElevenLabs API] ELEVEN_LABS_API_KEY not configured");
      return NextResponse.json(
        { error: "ELEVEN_LABS_API_KEY not configured" },
        { status: 500 }
      );
    }

    console.log("[ElevenLabs API] Getting signed URL (variables should be passed to startSession)");

    // Build the URL with agent_id only - variables are NOT passed here
    // According to ElevenLabs API docs, get_signed_url only accepts agent_id and optionally include_conversation_id
    const url = `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=agent_7701kc5gat2efqm8wbg84j7m2zbj`;

    console.log("[ElevenLabs API] Requesting signed URL from:", url);

    // Get a signed URL for the conversational agent
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ElevenLabs API] ElevenLabs API error response:", errorText);
      console.error("[ElevenLabs API] Response status:", response.status);
      return NextResponse.json(
        { error: "Failed to get signed URL" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[ElevenLabs API] Successfully received signed URL from ElevenLabs");
    console.log("[ElevenLabs API] Signed URL (truncated):", data.signed_url?.substring(0, 100) + "...");
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (error) {
    console.error("[ElevenLabs API] Error getting ElevenLabs token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

