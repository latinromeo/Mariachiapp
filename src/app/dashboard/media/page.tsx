
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { useUser, UserRole } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";


const TABS_CONFIG: { value: string; label: string; roles: UserRole[] }[] = [
  { value: "invoices", label: "Facturas de Gastos", roles: ['Administrador General', 'Contador', 'Beta Tester'] },
  { value: "scores", label: "Partituras", roles: ['Administrador General', 'Beta Tester'] },
  { value: "promo-videos", label: "Videos Promo", roles: ['Administrador General', 'Beta Tester'] },
  { value: "pro-photos", label: "Fotos Profesionales", roles: ['Administrador General', 'Beta Tester'] },
  { value: "client-photos", label: "Fotos de Clientes", roles: ['Administrador General', 'Beta Tester'] },
  { value: "other", label: "Otros Archivos", roles: ['Administrador General', 'Beta Tester'] },
];

export default function MediaPage() {
  const { user } = useUser();
  const { toast } = useToast();
  
  const availableTabs = TABS_CONFIG.filter(tab => tab.roles.includes(user.role));
  const [activeTab, setActiveTab] = useState(availableTabs[0]?.value || "");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i).toLocaleString('es-ES', { month: 'long', timeZone: 'UTC' })
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const renderPlaceholderContent = (title: string) => (
    <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg mt-6">
      <p className="font-semibold">No hay archivos en "{title}"</p>
      <p className="text-sm">Sube nuevos archivos para verlos aquí.</p>
    </div>
  );
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
      if (!file) {
          toast({
              variant: "destructive",
              title: "Ningún archivo seleccionado",
              description: "Por favor, selecciona un archivo para subir.",
          });
          return;
      }
      setIsUploading(true);
      // Simulate upload
      setTimeout(() => {
          setIsUploading(false);
          toast({
              title: "Función no implementada",
              description: "La subida de archivos es solo una demostración visual por ahora.",
          });
          setFile(null);
          // Reset file input
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if (fileInput) {
              fileInput.value = "";
          }
      }, 1500);
  };


  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Gestión Multimedia
        </h1>
        <p className="text-muted-foreground">
          Sube, visualiza y organiza tus archivos y facturas.
        </p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Subir Archivo</CardTitle>
            <CardDescription>
                Selecciona un archivo para subirlo a tu biblioteca multimedia.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="file-upload">Seleccionar archivo</Label>
                <Input id="file-upload" type="file" onChange={handleFileChange} disabled={isUploading} />
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleUpload} disabled={isUploading || !file}>
                {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="mr-2 h-4 w-4" />
                )}
                {isUploading ? "Subiendo..." : "Subir Archivo"}
            </Button>
        </CardFooter>
      </Card>


      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-auto w-full justify-start overflow-x-auto p-1">
          {availableTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="invoices" className="mt-6">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="filter-month">Filtrar por Mes:</Label>
                  <Select defaultValue="all">
                    <SelectTrigger id="filter-month" className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Todos los Meses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Meses</SelectItem>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value} className="capitalize">{month.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="filter-year">Filtrar por Año:</Label>
                  <Select defaultValue="all">
                    <SelectTrigger id="filter-year" className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Todos los Años" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Años</SelectItem>
                      {years.map(year => (
                        <SelectItem key={year} value={String(year)}>{String(year)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mt-6">Listado de Facturas (0)</h3>
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg mt-4">
                  <p>No hay archivos en esta categoría o que coincidan con el filtro actual.</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="scores">{renderPlaceholderContent("Partituras")}</TabsContent>
        <TabsContent value="promo-videos">{renderPlaceholderContent("Videos Promo")}</TabsContent>
        <TabsContent value="pro-photos">{renderPlaceholderContent("Fotos Profesionales")}</TabsContent>
        <TabsContent value="client-photos">{renderPlaceholderContent("Fotos de Clientes")}</TabsContent>
        <TabsContent value="other">{renderPlaceholderContent("Otros Archivos")}</TabsContent>
      </Tabs>
    </div>
  );
}
