
"use client"

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Music, KeyRound, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSongs, type SongDetail } from "@/services/eventService";
import { SONG_CATEGORIES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export default function RepertoirePage() {
  const [allSongs, setAllSongs] = useState<SongDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchSongs = async () => {
      setIsLoading(true);
      try {
        const data = await getSongs();
        setAllSongs(data);
      } catch (error) {
        console.error("Failed to fetch songs", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSongs();
  }, []);
  
  const filteredSongs = useMemo(() => {
    if (!searchTerm) {
      return allSongs;
    }
    return allSongs.filter(song =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (song.artist && song.artist.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allSongs, searchTerm]);

  const songsByCategory = useMemo(() => {
    return filteredSongs.reduce((acc, song) => {
      const category = song.category;
      (acc[category] = acc[category] || []).push(song);
      return acc;
    }, {} as Record<string, SongDetail[]>);
  }, [filteredSongs]);

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
        <Input 
          type="search" 
          placeholder="Buscar por título o artista..." 
          className="pl-8 sm:w-[300px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i}><CardHeader><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader><CardContent><div className="flex gap-2"><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /></div></CardContent></Card>
            ))}
        </div>
      ) : (
        <Tabs defaultValue={SONG_CATEGORIES[0]} className="w-full">
          <TabsList className="h-auto w-full justify-start overflow-x-auto p-1">
            {SONG_CATEGORIES.map((category) => (
              <TabsTrigger key={category} value={category} className="whitespace-nowrap">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          {SONG_CATEGORIES.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(songsByCategory[category] || []).length > 0 ? (
                  songsByCategory[category].map((song) => (
                    <Card key={song.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Music className="h-5 w-5 text-primary" />{song.title}</CardTitle>
                        {song.artist && <CardDescription>{song.artist}</CardDescription>}
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                          {song.key && (
                            <Badge variant="outline" className="flex items-center gap-1"><KeyRound className="h-3 w-3" /> Tono: {song.key}</Badge>
                          )}
                          {(song.suggestedEvents || []).map((tag) => (
                            <Badge key={tag} variant="secondary" className="capitalize flex items-center gap-1"><Star className="h-3 w-3" /> {tag}</Badge>
                          ))}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                   <p className="text-muted-foreground col-span-full py-8 text-center">No se encontraron canciones {searchTerm ? `para "${searchTerm}"` : ""} en esta categoría.</p>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
