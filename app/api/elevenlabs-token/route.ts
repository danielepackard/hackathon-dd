import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "ELEVEN_LABS_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Get a signed URL for the conversational agent
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=agent_7701kc5gat2efqm8wbg84j7m2zbj`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      return NextResponse.json(
        { error: "Failed to get signed URL" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (error) {
    console.error("Error getting ElevenLabs token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

