import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return handleRequest(null);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return handleRequest(body.variables || null);
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

async function handleRequest(variables: Record<string, string> | null) {
  try {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "ELEVEN_LABS_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Build the URL with agent_id
    let url = `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=agent_7701kc5gat2efqm8wbg84j7m2zbj`;

    // Add variables as query parameters if provided
    if (variables) {
      const urlParams = new URLSearchParams();
      Object.entries(variables).forEach(([key, value]) => {
        if (value) {
          // Use var_ prefix for individual parameters
          urlParams.append(`var_${key}`, value);
        }
      });
      if (urlParams.toString()) {
        url += `&${urlParams.toString()}`;
      }
    }

    // Get a signed URL for the conversational agent
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
      },
    });

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

