import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    console.log("[Music API] Received request:", {
      timestamp: new Date().toISOString(),
      prompt: prompt?.substring(0, 100) + (prompt?.length > 100 ? "..." : ""),
      promptLength: prompt?.length,
    });

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      console.error("[Music API] Validation failed: Invalid prompt");
      return NextResponse.json(
        { error: "Prompt is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVEN_LABS_API_KEY;

    if (!apiKey) {
      console.error("[Music API] Configuration error: API key not found");
      return NextResponse.json(
        { error: "Eleven Labs API key is not configured. Please set ELEVEN_LABS_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    const requestBody = {
      prompt: prompt.trim(),
      music_length_ms: 30000, // 30 seconds default - adjust as needed
      model_id: "music_v1", // Default model
      force_instrumental: true, // Always generate instrumental-only music (no voices)
      // Optional parameters:
      // composition_plan: {}, // Optional detailed composition plan
    };

    console.log("[Music API] Sending request to Eleven Labs:", {
      endpoint: "https://api.elevenlabs.io/v1/music",
      method: "POST",
      requestBody: {
        ...requestBody,
        prompt: requestBody.prompt.substring(0, 100) + (requestBody.prompt.length > 100 ? "..." : ""),
      },
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey?.substring(0, 10) + "...",
    });

    const startTime = Date.now();
    
    // Eleven Labs Music Generation API endpoint
    const response = await fetch("https://api.elevenlabs.io/v1/music", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const requestDuration = Date.now() - startTime;

    console.log("[Music API] Received response from Eleven Labs:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      duration: `${requestDuration}ms`,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[Music API] Eleven Labs API error:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      return NextResponse.json(
        { error: `Eleven Labs API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Eleven Labs returns audio data (MP3 format)
    const audioData = await response.arrayBuffer();
    
    console.log("[Music API] Audio data received:", {
      size: audioData.byteLength,
      sizeInKB: (audioData.byteLength / 1024).toFixed(2),
      format: "mp3",
    });
    
    // Convert audio data to base64 for easy transmission
    const base64Audio = Buffer.from(audioData).toString("base64");
    
    console.log("[Music API] Successfully processed audio:", {
      base64Length: base64Audio.length,
      totalRequestDuration: `${Date.now() - startTime}ms`,
    });
    
    // Return the audio data as base64 string
    return NextResponse.json({
      success: true,
      message: "Music generated successfully",
      audio: base64Audio,
      audioSize: audioData.byteLength,
      format: "mp3",
    });

  } catch (error) {
    console.error("[Music API] Unexpected error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to generate music. Please try again." },
      { status: 500 }
    );
  }
}
