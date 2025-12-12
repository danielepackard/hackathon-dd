import Card from "@/components/ui/Card";

export const metadata = {
  title: "Features | Hackathon DD",
  description: "Explore the features of our application",
};

const features = [
  {
    title: "Next.js App Router",
    description:
      "Built with the latest Next.js App Router for optimal performance and developer experience.",
  },
  {
    title: "TypeScript",
    description:
      "Full type safety throughout the application for better code quality and developer confidence.",
  },
  {
    title: "Tailwind CSS",
    description:
      "Modern, utility-first CSS framework for rapid UI development and consistent design.",
  },
  {
    title: "Vercel Ready",
    description:
      "Optimized for seamless deployment on Vercel with zero configuration needed.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Features</h1>
        <p className="text-xl text-gray-600 mb-12">
          Discover what makes our application special
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index} title={feature.title}>
              <p className="text-gray-700">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
