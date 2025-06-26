
"use client"

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Search, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type ManualFinanceEntry, getManualFinanceEntries } from "@/services/eventService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { FINANCE_CATEGORIES } from "@/lib/constants";

const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return "RD$0.00";
    }
    return `RD$${(value).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function InvoicesPage() {
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const [invoices, setInvoices] = useState<ManualFinanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
        const allEntries = await getManualFinanceEntries();
        const invoiceEntries = allEntries.filter(entry => entry.type === 'expense' && entry.invoiceUrl);
        setInvoices(invoiceEntries);
    } catch (error) {
        console.error("Failed to fetch invoices", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las facturas.' });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInvoices();
    
    const handleAgendaUpdate = () => fetchInvoices();
    window.addEventListener('agendaUpdated', handleAgendaUpdate);
    return () => {
        window.removeEventListener('agendaUpdated', handleAgendaUpdate);
    };
  }, [fetchInvoices]);

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    return invoices.filter(invoice => 
        invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.category && invoice.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [invoices, searchTerm]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        if (!selectedFile.type.startsWith('image/')) {
            toast({
                variant: 'destructive',
                title: 'Archivo no válido',
                description: 'Por favor, selecciona un archivo de imagen (JPG, PNG, etc.).',
            });
            return;
        }
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
                  <Label htmlFor="file-upload">Seleccionar factura (imagen)</Label>
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

      <Card className="mt-8">
        <CardHeader>
            <CardTitle>Listado de Facturas ({filteredInvoices.length})</CardTitle>
             <div className="relative mt-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Buscar por descripción o categoría..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({length: 3}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-20"/></TableCell>
                                <TableCell><Skeleton className="h-4 w-48"/></TableCell>
                                <TableCell><Skeleton className="h-4 w-24"/></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto"/></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto"/></TableCell>
                            </TableRow>
                        ))
                    ) : filteredInvoices.length > 0 ? (
                        filteredInvoices.map(invoice => {
                            const categoryLabel = FINANCE_CATEGORIES.find(c => c.value === invoice.category)?.label || invoice.category;
                            return (
                                <TableRow key={invoice.id}>
                                    <TableCell>{format(parseISO(invoice.date), 'dd/MM/yyyy', { locale: es })}</TableCell>
                                    <TableCell className="font-medium">{invoice.description}</TableCell>
                                    <TableCell className="capitalize">{categoryLabel}</TableCell>
                                    <TableCell className="text-right font-semibold text-destructive">{formatCurrency(invoice.amount)}</TableCell>
                                    <TableCell className="text-right">
                                        {invoice.invoiceUrl && (
                                            <Button asChild variant="outline" size="icon">
                                                <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer" title="Ver/Descargar Factura">
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No se encontraron facturas. Sube una para comenzar.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
