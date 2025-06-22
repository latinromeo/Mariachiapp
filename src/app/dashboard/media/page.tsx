
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

const mediaItems = [
  { src: "https://placehold.co/600x400.png", alt: "Mariachi band performing at a wedding.", hint: "mariachi wedding" },
  { src: "https://placehold.co/400x600.png", alt: "Close-up of a guitarist.", hint: "mariachi guitarist" },
  { src: "https://placehold.co/600x400.png", alt: "Band posing for a group photo.", hint: "mariachi band" },
  { src: "https://placehold.co/600x400.png", alt: "Trumpet player in action.", hint: "mariachi trumpet" },
  { src: "https://placehold.co/400x600.png", alt: "Violinist playing with passion.", hint: "mariachi violinist" },
  { src: "https://placehold.co/600x400.png", alt: "Performance at an outdoor festival.", hint: "mariachi festival" },
  { src: "https://placehold.co/600x400.png", alt: "Singing a serenade.", hint: "mariachi serenade" },
  { src: "https://placehold.co/400x600.png", alt: "Detailed view of a traditional charro outfit.", hint: "charro suit" },
];

export default function MediaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Multimedia
        </h1>
        <p className="text-muted-foreground">
          Tu colección de fotos y videos de eventos.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mediaItems.map((item, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <Image
                src={item.src}
                alt={item.alt}
                data-ai-hint={item.hint}
                width={600}
                height={400}
                className="aspect-video w-full h-auto object-cover transition-transform hover:scale-105"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
