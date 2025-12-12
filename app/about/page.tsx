import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "About | Hackathon DD",
  description: "Learn more about our project",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About Us</h1>
        
        <div className="space-y-6">
          <Card>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Hackathon DD! This is a full-stack Next.js application
              built for the Elevenlabs hackathon. Our mission is to create
              innovative solutions using cutting-edge technology.
            </p>
          </Card>

          <Card title="Our Mission">
            <p className="text-gray-700 leading-relaxed">
              We're building something amazing with Next.js, TypeScript, and
              Tailwind CSS. This project demonstrates modern web development
              practices and is ready for deployment on Vercel.
            </p>
          </Card>

          <div className="flex gap-4">
            <Button href="/">Back to Home</Button>
            <Button href="/features" variant="secondary">
              View Features
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
