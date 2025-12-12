import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export const metadata = {
  title: "Home | D&D Voice Agent",
  description: "AI-powered Dungeon Master for your D&D campaigns",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="mb-8">
            <span className="text-6xl mb-4 block">🎲</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            AI Dungeon Master
          </h1>
          <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            Experience Dungeons & Dragons like never before with an AI-powered
            voice agent that acts as your Dungeon Master. Configure your game,
            gather your party, and embark on epic adventures!
          </p>
          <div className="flex gap-4 justify-center">
            <Button href="/configure" className="bg-purple-600 hover:bg-purple-700">
              Start New Campaign
            </Button>
            <Button href="/play" variant="secondary" className="bg-gray-600 hover:bg-gray-700 text-white">
              Continue Game
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-purple-500">
            <h3 className="text-xl font-semibold text-white mb-3">
              🎙️ Voice-Powered
            </h3>
            <p className="text-purple-200">
              Interact naturally with your AI Dungeon Master using voice
              commands powered by ElevenLabs.
            </p>
          </Card>
          <Card className="bg-slate-800 border-purple-500">
            <h3 className="text-xl font-semibold text-white mb-3">
              ⚙️ Easy Setup
            </h3>
            <p className="text-purple-200">
              Configure your campaign, add players, and customize game settings
              in minutes.
            </p>
          </Card>
          <Card className="bg-slate-800 border-purple-500">
            <h3 className="text-xl font-semibold text-white mb-3">
              🎭 Dynamic Storytelling
            </h3>
            <p className="text-purple-200">
              Experience immersive, adaptive storytelling that responds to your
              choices and actions.
            </p>
          </Card>
        </section>
      </div>
    </main>
  );
}
