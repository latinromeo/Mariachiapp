
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InvoicesPage() {
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i).toLocaleString('es-ES', { month: 'long', timeZone: 'UTC' })
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        setFileName(selectedFile.name);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'Ningún archivo seleccionado',
        description: 'Por favor, selecciona un archivo para subir.',
      });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const imageDataUri = reader.result as string;
      try {
        const res = await fetch('/api/analyze-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageDataUri }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Error en el servidor');
        }

        toast({
          title: '¡Gasto Registrado!',
          description: data.message,
        });
        
        // Dispatch event to update finance page if it's open
        window.dispatchEvent(new Event('agendaUpdated'));

      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error al Analizar Factura',
          description: error.message || 'No se pudo procesar el archivo.',
        });
      } finally {
        setIsUploading(false);
        setFile(null);
        setFileName('');
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo leer el archivo seleccionado.',
      });
      setIsUploading(false);
    };
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Facturas de Gastos
        </h1>
        <p className="text-muted-foreground">
          Sube, visualiza y gestiona las facturas de gastos del mariachi.
        </p>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle>Subir y Registrar Gasto</CardTitle>
              <CardDescription>
                  Sube una foto de una factura y la IA extraerá los datos para registrar el gasto automáticamente.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="file-upload">Seleccionar factura</Label>
                  <Input id="file-upload" type="file" onChange={handleFileChange} accept="image/*" disabled={isUploading} />
                  {fileName && <p className="text-sm text-muted-foreground">Archivo: {fileName}</p>}
              </div>
          </CardContent>
          <CardFooter>
              <Button onClick={handleUpload} disabled={isUploading || !file}>
                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {isUploading ? "Analizando..." : "Subir y Registrar Gasto"}
              </Button>
          </CardFooter>
      </Card>

      <div className="space-y-8 mt-8">
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
                <p className="text-xs">Los gastos registrados desde aquí aparecerán en la sección de Finanzas.</p>
              </div>
          </div>
          </div>
      </div>
    </div>
  );
}
