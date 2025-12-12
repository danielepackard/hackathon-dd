"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { useRouter } from "next/navigation";

interface DialogueMessage {
  id: string;
  speaker: "dm" | "team";
  text: string;
  timestamp: Date;
}

export default function PlayPage() {
  const router = useRouter();
  const [dialogueHistory, setDialogueHistory] = useState<DialogueMessage[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDialogueOpen, setIsDialogueOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dialogueEndRef = useRef<HTMLDivElement>(null);
  const imageGenerationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ElevenLabs conversation hook with controlled mic mute state
  const conversation = useConversation({
    micMuted: isMuted,
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
        // Read configuration from localStorage
        const configStr = localStorage.getItem("dnd-game-config");
        if (!configStr) {
          throw new Error("No game configuration found. Please configure your game first.");
        }

        const config = JSON.parse(configStr);
        
        // Map configuration to ElevenLabs variables
        const variables: Record<string, string> = {
          campaignLength: config.campaignLength || "",
          campaignGenre: config.genre || "",
        };

        // Map players (up to 3)
        config.players?.slice(0, 3).forEach((player: any, index: number) => {
          const playerNum = index + 1;
          variables[`player${playerNum}Name`] = player.name || "";
          variables[`player${playerNum}Species`] = player.species || "";
          variables[`player${playerNum}Class`] = player.class || "";
        });

        // Fill in empty slots for players 2 and 3 if not present
        for (let i = (config.players?.length || 0); i < 3; i++) {
          const playerNum = i + 1;
          variables[`player${playerNum}Name`] = "";
          variables[`player${playerNum}Species`] = "";
          variables[`player${playerNum}Class`] = "";
        }

        // First, get a signed URL from our API with variables
        const tokenResponse = await fetch("/api/elevenlabs-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ variables }),
        });
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

  // Handle mute toggle (controls microphone input via controlled state)
  const handleMuteToggle = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Handle reconnect
  const handleReconnect = async () => {
    setConnectionStatus("connecting");
    setErrorMessage(null);
    try {
      // Read configuration from localStorage
      const configStr = localStorage.getItem("dnd-game-config");
      if (!configStr) {
        throw new Error("No game configuration found. Please configure your game first.");
      }

      const config = JSON.parse(configStr);
      
      // Map configuration to ElevenLabs variables
      const variables: Record<string, string> = {
        campaignLength: config.campaignLength || "",
        campaignGenre: config.genre || "",
      };

      // Map players (up to 3)
      config.players?.slice(0, 3).forEach((player: any, index: number) => {
        const playerNum = index + 1;
        variables[`player${playerNum}Name`] = player.name || "";
        variables[`player${playerNum}Species`] = player.species || "";
        variables[`player${playerNum}Class`] = player.class || "";
      });

      // Fill in empty slots for players 2 and 3 if not present
      for (let i = (config.players?.length || 0); i < 3; i++) {
        const playerNum = i + 1;
        variables[`player${playerNum}Name`] = "";
        variables[`player${playerNum}Species`] = "";
        variables[`player${playerNum}Class`] = "";
      }

      // Get a fresh signed URL with variables
      const tokenResponse = await fetch("/api/elevenlabs-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ variables }),
      });
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

  // Handle end campaign - navigate to configure page
  const handleEndCampaign = async () => {
    await conversation.endSession();
    router.push("/configure");
  };

  return (
    <div className="dnd-theme min-h-screen relative overflow-hidden">
      {/* Full-screen Image Display */}
      <div className="absolute inset-0">
        <img
          src={currentImage || "/placeholder-castle.jpg"}
          alt="Scene illustration"
          className="w-full h-full object-cover"
        />
        {/* Overlay for connecting state */}
        {!currentImage && connectionStatus === "connecting" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-[var(--dnd-text-gold)] border-t-transparent rounded-full animate-spin" />
              <p className="text-[var(--dnd-text-light)] text-lg">
                Summoning the Dungeon Master...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-900/80 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-3">
          <span className="text-red-200 text-sm">⚠️ {errorMessage}</span>
          <button
            onClick={handleReconnect}
            className="text-white bg-red-700 hover:bg-red-600 px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Connection Status Indicator - Top Right */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            connectionStatus === "connected"
              ? "bg-green-500 animate-pulse"
              : connectionStatus === "connecting"
              ? "bg-yellow-500 animate-pulse"
              : connectionStatus === "error"
              ? "bg-red-500"
              : "bg-gray-500"
          }`}
        />
        <span className="text-xs text-white/80">
          {connectionStatus === "connected"
            ? "Live"
            : connectionStatus === "connecting"
            ? "Connecting..."
            : connectionStatus === "error"
            ? "Error"
            : "Offline"}
        </span>
      </div>

      {/* Dialogue Tab - Collapsed (Left side) */}
      {!isDialogueOpen && (
        <button
          onClick={() => setIsDialogueOpen(true)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 backdrop-blur-md border border-[var(--dnd-border)]/50 rounded-r-lg px-2 py-4 hover:bg-black/70 transition-all"
          title="Open Live Dialogue"
        >
          <span className="text-[var(--dnd-text-gold)] font-semibold text-sm whitespace-nowrap"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            📜 Live Dialogue
          </span>
        </button>
      )}

      {/* Dialogue Panel - Expanded (Left side) */}
      {isDialogueOpen && (
        <div className="absolute left-4 top-4 bottom-24 z-20 w-80 flex flex-col">
          <div className="bg-black/60 backdrop-blur-md rounded-xl border border-[var(--dnd-border)]/50 flex flex-col h-full overflow-hidden">
            {/* Header with Close Button */}
            <div className="px-4 py-3 border-b border-[var(--dnd-border)]/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">📜</span>
                <span className="text-[var(--dnd-text-gold)] font-semibold text-sm">Live Dialogue</span>
              </div>
              <button
                onClick={() => setIsDialogueOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center text-sm transition-all"
                title="Close dialogue"
              >
                ✕
              </button>
            </div>

            {/* Dialogue Messages */}
            <div className="flex-1 overflow-y-auto dialogue-scroll p-3 space-y-2">
              {dialogueHistory.length === 0 ? (
                <div className="text-center text-white/50 py-6">
                  <p className="text-sm">The story will unfold here...</p>
                  <p className="text-xs mt-1">Speak to the Dungeon Master to begin</p>
                </div>
              ) : (
                dialogueHistory.map((message) => (
                  <div
                    key={message.id}
                    className={`p-2.5 rounded-lg ${
                      message.speaker === "dm"
                        ? "bg-[var(--dnd-primary)]/30 border-l-2 border-[var(--dnd-text-gold)]"
                        : "bg-white/10 border-l-2 border-gray-400"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm">
                        {message.speaker === "dm" ? "🎭" : "👥"}
                      </span>
                      <span
                        className={`font-semibold text-xs ${
                          message.speaker === "dm"
                            ? "text-[var(--dnd-text-gold)]"
                            : "text-gray-300"
                        }`}
                      >
                        {message.speaker === "dm" ? "Dungeon Master" : "Team"}
                      </span>
                    </div>
                    <p className="text-white/90 text-sm pl-5">
                      {message.text}
                    </p>
                  </div>
                ))
              )}
              <div ref={dialogueEndRef} />
            </div>

            {/* Speaking Indicator */}
            {conversation.isSpeaking && (
              <div className="px-3 py-2 border-t border-[var(--dnd-border)]/30 flex items-center gap-2 shrink-0">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-[var(--dnd-text-gold)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 bg-[var(--dnd-text-gold)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 bg-[var(--dnd-text-gold)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-[var(--dnd-text-gold)] text-xs">
                  Dungeon Master is speaking...
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Controls - Center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        {/* End Campaign Button */}
        <button
          onClick={handleEndCampaign}
          className="px-5 py-2.5 rounded-full bg-red-600/70 hover:bg-red-600 backdrop-blur-sm text-white font-medium text-sm transition-all flex items-center gap-2"
          title="End campaign and return to configure"
        >
          🚪 End Campaign
        </button>

        {/* Mute Button */}
        <button
          onClick={handleMuteToggle}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all backdrop-blur-sm flex items-center gap-2 ${
            isMuted
              ? "bg-red-600/70 hover:bg-red-600 text-white"
              : "bg-green-600/70 hover:bg-green-600 text-white"
          }`}
          title={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {isMuted ? "🔇 Muted" : "🎤 Mic On"}
        </button>
      </div>
    </div>
  );
}

