
"use client"

import { useEffect, useState, useMemo } from "react";
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
import { Search, Music, KeyRound, Star, PlusCircle, Link as LinkIcon, FileText, Video, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSongs, type SongDetail } from "@/services/eventService";
import { SONG_CATEGORIES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SongForm } from "./song-form";

export default function RepertoirePage() {
  const [allSongs, setAllSongs] = useState<SongDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [songToEdit, setSongToEdit] = useState<SongDetail | null>(null);

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

  useEffect(() => {
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

  const handleOpenDialog = (song: SongDetail | null = null) => {
    setSongToEdit(song);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setSongToEdit(null);
    fetchSongs();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
            Repertorio
            </h1>
            <p className="text-muted-foreground">
            Explora y gestiona el catálogo de canciones de tu banda.
            </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Añadir Canción</span>
        </Button>
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
                    <Card key={song.id} className="flex flex-col">
                      <CardHeader className="flex-1">
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Music className="h-5 w-5 text-primary" />
                                {song.title}
                            </span>
                            <div className="flex items-center gap-2">
                              {song.youtubeUrl && (
                                  <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-primary" title="Ver en YouTube">
                                      <Video className="h-4 w-4" />
                                  </a>
                              )}
                              {song.sheetMusicUrl && (
                                  <a href={song.sheetMusicUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-primary" title="Ver partitura/letra">
                                      <FileText className="h-4 w-4" />
                                  </a>
                              )}
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenDialog(song)}>
                                 <Edit className="h-4 w-4" />
                                 <span className="sr-only">Editar</span>
                              </Button>
                            </div>
                        </CardTitle>
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
                      {song.audioUrl && (
                          <CardFooter className="p-4 pt-2">
                              <audio controls src={song.audioUrl} className="w-full h-10">
                                  Tu navegador no soporta el elemento de audio.
                              </audio>
                          </CardFooter>
                      )}
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
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Music className="h-5 w-5"/>{songToEdit ? 'Editar Canción' : 'Añadir Nueva Canción al Repertorio'}</DialogTitle>
                    <DialogDescription>
                        {songToEdit ? 'Modifica los detalles de la canción existente.' : 'Completa la información para registrar una nueva canción.'}
                    </DialogDescription>
                </DialogHeader>
                <SongForm 
                    onSuccess={handleSuccess} 
                    onCancel={() => setIsDialogOpen(false)}
                    initialData={songToEdit}
                />
            </DialogContent>
        </Dialog>
    </div>
  );
}
