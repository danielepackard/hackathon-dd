"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";

interface DialogueMessage {
  id: string;
  speaker: "dm" | "team";
  text: string;
  timestamp: Date;
}

export default function PlayPage() {
  const [dialogueHistory, setDialogueHistory] = useState<DialogueMessage[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dialogueEndRef = useRef<HTMLDivElement>(null);
  const imageGenerationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log("ElevenLabs agent connected");
      setConnectionStatus("connected");
      setErrorMessage(null);
    },
    onDisconnect: () => {
      console.log("ElevenLabs agent disconnected");
      setConnectionStatus("disconnected");
    },
    onMessage: (message) => {
      console.log("Message received:", message);
      
      // Add message to dialogue history
      const newMessage: DialogueMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        speaker: message.role === "agent" ? "dm" : "team",
        text: message.message,
        timestamp: new Date(),
      };
      
      setDialogueHistory((prev) => [...prev, newMessage]);
      
      // If it's from the DM, trigger image generation
      if (message.role === "agent" && message.message.length > 20) {
        // Debounce image generation
        if (imageGenerationTimeoutRef.current) {
          clearTimeout(imageGenerationTimeoutRef.current);
        }
        
        imageGenerationTimeoutRef.current = setTimeout(() => {
          generateImage(message.message);
        }, 2000);
      }
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      setConnectionStatus("error");
      setErrorMessage(error.message || "Connection error occurred");
    },
  });

  // Generate image from narrator text
  const generateImage = useCallback(async (narratorText: string) => {
    if (!narratorText.trim() || isImageLoading) return;

    setIsImageLoading(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narratorText }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();
      if (data.imageUrl) {
        setCurrentImage(data.imageUrl);
      }
    } catch (error) {
      console.error("Image generation error:", error);
    } finally {
      setIsImageLoading(false);
    }
  }, [isImageLoading]);

  // Connect to ElevenLabs agent on mount
  useEffect(() => {
    const connectAgent = async () => {
      setConnectionStatus("connecting");
      try {
        // First, get a signed URL from our API
        const tokenResponse = await fetch("/api/elevenlabs-token");
        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.signedUrl) {
          throw new Error(tokenData.error || "Failed to get signed URL");
        }

        // Connect using the signed URL
        await conversation.startSession({
          signedUrl: tokenData.signedUrl,
        });
      } catch (error) {
        console.error("Failed to connect to agent:", error);
        setConnectionStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to connect"
        );
      }
    };

    connectAgent();

    return () => {
      conversation.endSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Auto-scroll dialogue to bottom
  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dialogueHistory]);

  // Handle mute toggle
  const handleMuteToggle = useCallback(async () => {
    try {
      if (isMuted) {
        await conversation.setVolume({ volume: 1 });
      } else {
        await conversation.setVolume({ volume: 0 });
      }
      setIsMuted(!isMuted);
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  }, [conversation, isMuted]);

  // Handle reconnect
  const handleReconnect = async () => {
    setConnectionStatus("connecting");
    setErrorMessage(null);
    try {
      // Get a fresh signed URL
      const tokenResponse = await fetch("/api/elevenlabs-token");
      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.signedUrl) {
        throw new Error(tokenData.error || "Failed to get signed URL");
      }

      await conversation.startSession({
        signedUrl: tokenData.signedUrl,
      });
    } catch (error) {
      console.error("Reconnection failed:", error);
      setConnectionStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to reconnect"
      );
    }
  };

  // Handle end session
  const handleEndSession = async () => {
    await conversation.endSession();
    setConnectionStatus("disconnected");
  };

  return (
    <div className="dnd-theme min-h-screen relative">
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between border-b-2 border-[var(--dnd-border)]">
          <h1 className="dnd-title text-2xl md:text-3xl">⚔️ Quest in Progress</h1>
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-500 animate-pulse"
                    : connectionStatus === "connecting"
                    ? "bg-yellow-500 animate-pulse"
                    : connectionStatus === "error"
                    ? "bg-red-500"
                    : "bg-gray-500"
                }`}
              />
              <span className="text-sm text-[var(--dnd-text-light)] hidden md:inline">
                {connectionStatus === "connected"
                  ? "Connected"
                  : connectionStatus === "connecting"
                  ? "Connecting..."
                  : connectionStatus === "error"
                  ? "Error"
                  : "Disconnected"}
              </span>
            </div>

            {/* Mute Button */}
            <button
              onClick={handleMuteToggle}
              className={`dnd-btn px-4 py-2 rounded-lg font-semibold ${
                isMuted ? "dnd-btn-active" : ""
              }`}
              title={isMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMuted ? "🔇 Muted" : "🎤 Mic On"}
            </button>

            {/* End Session Button */}
            {connectionStatus === "connected" && (
              <button
                onClick={handleEndSession}
                className="dnd-btn px-4 py-2 rounded-lg font-semibold bg-red-800 hover:bg-red-700 border-red-600"
              >
                End Session
              </button>
            )}
          </div>
        </header>

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-red-900/80 border-b border-red-700 px-6 py-3 flex items-center justify-between">
            <span className="text-red-200">⚠️ {errorMessage}</span>
            <button
              onClick={handleReconnect}
              className="dnd-btn px-4 py-2 rounded-lg text-sm"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Image Display Area */}
          <div className="flex-1 relative min-h-[40vh] md:min-h-[50vh]">
            {currentImage ? (
              <div className="relative w-full h-full">
                <img
                  src={currentImage}
                  alt="Scene illustration"
                  className="w-full h-full object-cover"
                />
                {isImageLoading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-[var(--dnd-text-gold)] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[var(--dnd-text-gold)] text-sm">
                        Generating new scene...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2d1b0e]">
                {connectionStatus === "connecting" ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-[var(--dnd-text-gold)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[var(--dnd-text-light)] text-lg">
                      Summoning the Dungeon Master...
                    </p>
                  </div>
                ) : connectionStatus === "connected" ? (
                  <div className="flex flex-col items-center gap-4 text-center px-6">
                    <span className="text-6xl">🏰</span>
                    <p className="text-[var(--dnd-text-light)] text-lg">
                      Your adventure awaits...
                    </p>
                    <p className="text-[var(--dnd-text-light)]/60 text-sm">
                      Speak to begin your quest. Images will appear as the story unfolds.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-6xl">🎲</span>
                    <p className="text-[var(--dnd-text-light)] text-lg">
                      Ready to play
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dialogue Box */}
          <div className="dnd-card mx-4 mb-4 md:mx-6 md:mb-6 flex flex-col max-h-[35vh]">
            <div className="dnd-section-title px-4 py-3 text-lg flex items-center gap-2">
              <span>📜</span>
              <span>Live Dialogue</span>
            </div>

            <div className="flex-1 overflow-y-auto dialogue-scroll p-4 space-y-3">
              {dialogueHistory.length === 0 ? (
                <div className="text-center text-[var(--dnd-text-light)]/60 py-8">
                  <p>The story will unfold here...</p>
                  <p className="text-sm mt-2">
                    Speak to the Dungeon Master to begin
                  </p>
                </div>
              ) : (
                dialogueHistory.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.speaker === "dm" ? "dialogue-dm" : "dialogue-team"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {message.speaker === "dm" ? "🎭" : "👥"}
                      </span>
                      <span
                        className={`font-semibold text-sm ${
                          message.speaker === "dm"
                            ? "text-[var(--dnd-text-gold)]"
                            : "text-gray-300"
                        }`}
                      >
                        {message.speaker === "dm" ? "Dungeon Master" : "Team"}
                      </span>
                    </div>
                    <p className="text-[var(--dnd-text-light)] pl-7">
                      {message.text}
                    </p>
                  </div>
                ))
              )}
              <div ref={dialogueEndRef} />
            </div>

            {/* Speaking Indicator */}
            {conversation.isSpeaking && (
              <div className="px-4 py-2 border-t border-[var(--dnd-border)] flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[var(--dnd-text-gold)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-[var(--dnd-text-gold)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-[var(--dnd-text-gold)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-[var(--dnd-text-gold)] text-sm">
                  Dungeon Master is speaking...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

