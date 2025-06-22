
"use client"

import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Upload, MoreVertical, Image as ImageIcon, Video, Music, Download, Trash2, X } from "lucide-react";
import { type MediaFile, getMedia } from "@/services/eventService";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const fileTypeIcons = {
  image: <ImageIcon className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
};

export default function MediaPage() {
  const [allMedia, setAllMedia] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "image" | "video" | "audio">("all");
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMedia = async () => {
      setIsLoading(true);
      try {
        const data = await getMedia();
        setAllMedia(data);
      } catch (error) {
        console.error("Failed to fetch media", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedia();
  }, []);
  
  const filteredMedia = useMemo(() => {
    let media = [...allMedia];
    
    if (activeTab !== "all") {
      media = media.filter(item => item.type === activeTab);
    }

    if (searchTerm) {
      media = media.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.tags && item.tags.join(' ').toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return media;
  }, [allMedia, searchTerm, activeTab]);

  const handleDelete = (id: string) => {
    // In a real app, this would call a service to delete the file
    setAllMedia(prev => prev.filter(item => item.id !== id));
    toast({ title: "Archivo Eliminado", description: "El archivo ha sido eliminado (simulación)." });
  }

  const handleUploadSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real app, this would handle file upload and data submission
    console.log("Upload form submitted");
    toast({ title: "Carga Exitosa", description: "El archivo ha sido subido (simulación)." });
    setIsUploadOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Multimedia
          </h1>
          <p className="text-muted-foreground">
            Tu colección de fotos y videos de eventos.
          </p>
        </div>
         <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Subir Archivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Subir Nuevo Archivo</DialogTitle>
                <DialogDescription>Añade un nuevo archivo a tu biblioteca multimedia.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="file-upload">Archivo</Label>
                      <Input id="file-upload" type="file" />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="file-title">Título (Opcional)</Label>
                      <Input id="file-title" placeholder="Ej: Foto Grupal Boda Pérez" />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="file-notes">Notas (Opcional)</Label>
                      <Textarea id="file-notes" placeholder="Descripción del archivo, personas involucradas, etc." />
                  </div>
                  <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancelar</Button>
                      <Button type="submit">Subir</Button>
                  </DialogFooter>
              </form>
            </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Buscar por nombre o etiqueta..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-4 sm:w-auto">
            <TabsTrigger value="all">Todo</TabsTrigger>
            <TabsTrigger value="image">
                <ImageIcon className="mr-2 h-4 w-4 sm:hidden"/>Imágenes
            </TabsTrigger>
            <TabsTrigger value="video">
                <Video className="mr-2 h-4 w-4 sm:hidden"/>Videos
            </TabsTrigger>
            <TabsTrigger value="audio">
                <Music className="mr-2 h-4 w-4 sm:hidden"/>Audio
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <Card key={i}><CardHeader className="p-0"><Skeleton className="aspect-video w-full h-auto" /></CardHeader><CardContent className="p-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2 mt-2" /></CardContent></Card>)}
          </div>
      ) : filteredMedia.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <Card key={item.id} className="overflow-hidden group flex flex-col">
                <CardHeader className="p-0 relative">
                    <Image
                        src={item.url}
                        alt={item.name}
                        data-ai-hint={item.hint}
                        width={600}
                        height={400}
                        className="aspect-video w-full h-auto object-cover transition-transform hover:scale-105 cursor-pointer"
                        onClick={() => setPreviewFile(item)}
                    />
                     <div className="absolute top-2 right-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full opacity-80 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setPreviewFile(item)}>Ver</DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Download className="mr-2 h-4 w-4" /> Descargar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
              <CardContent className="p-3 flex-1">
                <p className="font-semibold text-sm truncate" title={item.name}>{item.name}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1.5">{fileTypeIcons[item.type]} {item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
                    <span>{formatBytes(item.size)}</span>
                </div>
              </CardContent>
              {item.tags && item.tags.length > 0 && (
                <CardFooter className="p-3 pt-0">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 2).map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                  </div>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg">
          <p className="font-semibold">No se encontraron archivos.</p>
          <p className="text-sm">Intenta ajustar tu búsqueda o filtros, o sube un nuevo archivo.</p>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl p-0">
          {previewFile && (
            <>
              <div className="relative">
                {previewFile.type === 'image' && (
                  <Image src={previewFile.url} alt={previewFile.name} width={1200} height={800} className="w-full h-auto max-h-[80vh] object-contain rounded-t-lg" />
                )}
                {previewFile.type === 'video' && (
                  <div className="w-full aspect-video bg-black flex items-center justify-center text-white rounded-t-lg">
                      <Video className="h-16 w-16 text-muted" /> <p className="ml-4 text-xl font-semibold">Simulador de Video Player</p>
                  </div>
                )}
                {previewFile.type === 'audio' && (
                  <div className="w-full h-64 bg-black flex items-center justify-center text-white rounded-t-lg">
                      <Music className="h-16 w-16 text-muted" /> <p className="ml-4 text-xl font-semibold">Simulador de Audio Player</p>
                  </div>
                )}
                <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-black/50 hover:bg-black/75 text-white hover:text-white rounded-full">
                    <X className="h-5 w-5"/>
                    <span className="sr-only">Cerrar</span>
                    </Button>
                </DialogClose>
              </div>
              <div className="p-6">
                <DialogTitle>{previewFile.name}</DialogTitle>
                <DialogDescription>Subido el {new Date(previewFile.uploadedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</DialogDescription>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
