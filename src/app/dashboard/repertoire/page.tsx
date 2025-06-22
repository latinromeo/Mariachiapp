
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const repertoire = [
  { title: "El Rey", artist: "Vicente Fernández", tags: ["Clásico", "Ranchera"] },
  { title: "Cielito Lindo", artist: "Quirino Mendoza y Cortés", tags: ["Tradicional", "Popular"] },
  { title: "Si Nos Dejan", artist: "José Alfredo Jiménez", tags: ["Romántica", "Boda"] },
  { title: "La Bamba", artist: "Ritchie Valens", tags: ["Fiesta", "Veracruz"] },
  { title: "Volver, Volver", artist: "Fernando Z. Maldonado", tags: ["Clásico", "Desamor"] },
  { title: "Amor Eterno", artist: "Juan Gabriel", tags: ["Balada", "Funeral"] },
  { title: "Las Mañanitas", artist: "Traditional", tags: ["Cumpleaños", "Celebración"] },
  { title: "Guadalajara", artist: "Pepe Guízar", tags: ["Tradicional", "Jalisco"] },
];

export default function RepertoirePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Repertorio
        </h1>
        <p className="text-muted-foreground">
          Explora y gestiona el catálogo de canciones de tu banda.
        </p>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input type="search" placeholder="Buscar canciones..." className="pl-8 sm:w-[300px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {repertoire.map((song) => (
          <Card key={song.title}>
            <CardHeader>
              <CardTitle>{song.title}</CardTitle>
              <CardDescription>{song.artist}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {song.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
