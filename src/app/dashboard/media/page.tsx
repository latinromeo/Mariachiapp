"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { useUser, UserRole } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { analyzeInvoice } from "@/ai/flows/analyze-invoice-flow";
import { createManualFinanceEntry } from "@/services/eventService";
import { format } from 'date-fns';


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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i).toLocaleString('es-ES', { month: 'long', timeZone: 'UTC' })
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) {
        toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona un archivo primero.' });
        return;
    }
    
    setIsAnalyzing(true);
    
    try {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = async () => {
            try {
                const invoiceImageUri = reader.result as string;

                const aiResult = await analyzeInvoice({
                    invoiceImageUri,
                    currentDate: format(new Date(), 'yyyy-MM-dd'),
                });
                
                const financeEntry = {
                    type: 'expense' as const,
                    description: aiResult.description,
                    amount: aiResult.amount,
                    date: aiResult.date,
                    category: aiResult.category,
                };
                
                const dbResult = await createManualFinanceEntry(financeEntry);

                if (dbResult.success) {
                    toast({
                        title: "¡Gasto Registrado!",
                        description: `Se ha creado un gasto de ${financeEntry.amount} por "${financeEntry.description}".`,
                    });
                    setSelectedFile(null);
                } else {
                    throw new Error(dbResult.error || "No se pudo guardar el gasto en la base de datos.");
                }
            } catch (error: any) {
                console.error("Error during analysis or DB operation:", error);
                toast({
                    variant: 'destructive',
                    title: 'Error en el Proceso',
                    description: error.message || 'El asistente no pudo procesar la factura. Inténtalo de nuevo.',
                });
            } finally {
                setIsAnalyzing(false);
            }
        };
        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            toast({
                variant: 'destructive',
                title: 'Error de Lectura',
                description: 'No se pudo leer el archivo de la factura.',
            });
            setIsAnalyzing(false);
        }
    } catch (error: any) {
        // This catch block is for synchronous errors before the reader starts.
        console.error("Error setting up file reader:", error);
         toast({
            variant: 'destructive',
            title: 'Error Inesperado',
            description: 'Ocurrió un error al iniciar el proceso de carga.',
        });
        setIsAnalyzing(false);
    }
  };

  const renderPlaceholderContent = (title: string) => (
    <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg mt-6">
      <p className="font-semibold">No hay archivos en "{title}"</p>
      <p className="text-sm">Sube nuevos archivos para verlos aquí.</p>
    </div>
  );

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-auto w-full justify-start overflow-x-auto p-1">
          {availableTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="invoices" className="mt-6">
          <div className="space-y-8">
             {user.role === 'Administrador General' && (
                <Card>
                <CardHeader>
                    <CardTitle>Subir y Analizar Factura de Gasto</CardTitle>
                    <CardDescription>Sube una imagen de una factura y el asistente la registrará como un gasto automáticamente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                        <Label htmlFor="invoice-file-input" className="font-medium">Seleccionar Archivo de Factura:</Label>
                        <div className="flex items-center gap-4 mt-2">
                            <Button asChild className="shrink-0">
                            <label htmlFor="invoice-file-input" className="cursor-pointer">Seleccionar archivo</label>
                            </Button>
                            <span className="text-sm text-muted-foreground truncate">{selectedFile ? selectedFile.name : 'Ningún archivo seleccionado'}</span>
                            <Input id="invoice-file-input" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                        </div>
                        </div>
                        <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto" onClick={handleUploadAndAnalyze} disabled={isAnalyzing || !selectedFile}>
                        {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {isAnalyzing ? 'Analizando Factura...' : 'Subir y Registrar Gasto'}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            Formatos soportados: JPG, PNG, WEBP.
                        </p>
                    </div>
                </CardContent>
                </Card>
             )}

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
