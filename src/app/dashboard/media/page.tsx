
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { es } from "date-fns/locale";
import { Upload } from "lucide-react";
import { useUser, UserRole } from "@/lib/auth";

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
  
  const availableTabs = TABS_CONFIG.filter(tab => tab.roles.includes(user.role));
  const [activeTab, setActiveTab] = useState(availableTabs[0]?.value || "");

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [fileName, setFileName] = useState("ningún archivo seleccionado");

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i).toLocaleString('es-ES', { month: 'long', timeZone: 'UTC' })
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFileName(event.target.files[0].name);
    } else {
      setFileName("ningún archivo seleccionado");
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
             {user.role !== 'Contador' && (
                <Card>
                <CardHeader>
                    <CardTitle>Subir Factura de Gasto</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-8 md:grid-cols-2 items-start">
                    <div className="flex flex-col items-center">
                        <Label className="mb-2 self-start font-medium">Fecha de la Factura:</Label>
                        <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border"
                        locale={es}
                        initialFocus
                        />
                    </div>
                    <div className="space-y-4 pt-8">
                        <div>
                        <Label className="font-medium">Seleccionar Archivo de Factura:</Label>
                        <div className="flex items-center gap-4 mt-2">
                            <Button asChild className="shrink-0">
                            <label htmlFor="invoice-file-input" className="cursor-pointer">Seleccionar archivo</label>
                            </Button>
                            <span className="text-sm text-muted-foreground truncate">{fileName}</span>
                            <Input id="invoice-file-input" type="file" className="hidden" onChange={handleFileChange} />
                        </div>
                        </div>
                        <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white w-full" disabled>
                        <Upload className="mr-2 h-4 w-4" />
                        Subir Factura
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">Nota: La subida de archivos a la nube no está implementada. Esto es solo para diseño visual.</p>
                    </div>
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
