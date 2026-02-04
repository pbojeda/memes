import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">MemeStore</h1>
      <p className="text-lg text-muted-foreground">
        Meme Products E-commerce Platform
      </p>
      <div className="mt-8 flex gap-4">
        <Button>Get Started</Button>
        <Button variant="outline">Learn More</Button>
      </div>
    </main>
  );
}
