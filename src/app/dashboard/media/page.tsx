
"use client"

import { useState, useEffect, useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser, type UserRole } from "@/lib/auth";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, FileText, Video, Image as ImageIcon, File, Download, Link as LinkIcon, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type MediaFile, getMedia, type MediaCategory } from "@/services/eventService";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

const TABS_CONFIG: { value: MediaCategory; label: string; roles: UserRole[] }[] = [
  { value: "scores", label: "Partituras", roles: ['Administrador General', 'Beta Tester', 'Director Musical'] },
  { value: "promo-videos", label: "Videos Promo", roles: ['Administrador General', 'Beta Tester'] },
  { value: "pro-photos", label: "Fotos Profesionales", roles: ['Administrador General', 'Beta Tester'] },
  { value: "client-photos", label: "Fotos de Clientes", roles: ['Administrador General', 'Beta Tester', 'Coordinador de Eventos'] },
  { value: "other", label: "Otros Archivos", roles: ['Administrador General', 'Beta Tester'] },
];

const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-10 w-10 text-blue-500" />;
    if (fileType.startsWith('video/')) return <Video className="h-10 w-10 text-red-500" />;
    if (fileType === 'application/pdf') return <FileText className="h-10 w-10 text-orange-500" />;
    return <File className="h-10 w-10 text-muted-foreground" />;
};


export default function MediaPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<MediaCategory | "">("");
  const [isUploading, setIsUploading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const availableTabs = TABS_CONFIG.filter(tab => tab.roles.includes(user.role));
  const [activeTab, setActiveTab] = useState<string>(availableTabs[0]?.value || "");

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const files = await getMedia();
      setMediaFiles(files);
    } catch (error) {
      console.error("Failed to fetch media:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los archivos multimedia." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const filteredMedia = useMemo(() => {
    return mediaFiles.filter(mf => mf.category === activeTab);
  }, [mediaFiles, activeTab]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !category) {
      toast({ variant: 'destructive', title: 'Datos incompletos', description: 'Por favor, selecciona un archivo y una categoría.' });
      return;
    }
    setIsUploading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const fileDataUri = reader.result as string;
        try {
            const res = await fetch('/api/upload-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    fileDataUri, 
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    category,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Error en el servidor');
            }
            toast({ title: '¡Archivo Subido!', description: `"${file.name}" se ha guardado exitosamente.` });
            fetchMedia(); // Refresh list
            setFile(null);
            setCategory("");
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error al Subir', description: error.message });
        } finally {
            setIsUploading(false);
        }
    };
    reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo leer el archivo.' });
        setIsUploading(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Gestión Multimedia
        </h1>
        <p className="text-muted-foreground">
          Sube, visualiza y organiza tus archivos multimedia.
        </p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Subir Nuevo Archivo</CardTitle>
            <CardDescription>Selecciona un archivo y una categoría para subirlo a la nube.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
            <div className="grid gap-2">
                <Label htmlFor="category-select">Categoría</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as MediaCategory)}>
                    <SelectTrigger id="category-select"><SelectValue placeholder="Selecciona una categoría..." /></SelectTrigger>
                    <SelectContent>
                        {availableTabs.map(tab => (
                            <SelectItem key={tab.value} value={tab.value}>{tab.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="file-upload">Archivo</Label>
                <Input id="file-upload" type="file" onChange={handleFileChange} disabled={isUploading} />
                {file && <p className="text-sm text-muted-foreground truncate">Seleccionado: {file.name}</p>}
             </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleUpload} disabled={isUploading || !file || !category}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isUploading ? "Subiendo..." : "Subir Archivo"}
            </Button>
        </CardFooter>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-auto w-full justify-start overflow-x-auto p-1">
          {availableTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label} ({mediaFiles.filter(f => f.category === tab.value).length})</TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-48" />)}
                </div>
            ) : filteredMedia.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {filteredMedia.map(media => (
                        <Card key={media.id} className="flex flex-col">
                            <CardContent className="p-4 flex items-center justify-center aspect-square">
                                {media.fileType.startsWith('image/') ? (
                                    <Image src={media.url} alt={media.name} width={200} height={200} className="object-cover rounded-md max-h-full w-auto" />
                                ) : (
                                    getFileIcon(media.fileType)
                                )}
                            </CardContent>
                            <CardFooter className="flex flex-col items-start gap-2 p-3 border-t">
                                <p className="font-semibold text-sm leading-tight truncate w-full">{media.name}</p>
                                <div className="flex justify-between w-full items-center">
                                    <p className="text-xs text-muted-foreground">{new Date(media.createdAt).toLocaleDateString()}</p>
                                    <a href={media.url} target="_blank" rel="noopener noreferrer" title="Ver/Descargar">
                                        <ExternalLink className="h-4 w-4 text-primary" />
                                    </a>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg">
                    <p>No hay archivos en esta categoría.</p>
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
