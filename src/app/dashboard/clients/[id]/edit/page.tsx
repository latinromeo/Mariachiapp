
"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getClientById, type ClientData } from "@/services/eventService";
import { ClientForm } from "@/app/dashboard/clients/client-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EditClientPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const clientId = params.id as string;
    const [client, setClient] = useState<ClientData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (clientId) {
            const fetchClient = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const data = await getClientById(clientId);
                    if (data) {
                        setClient(data);
                    } else {
                        setError("No se pudo encontrar el cliente.");
                    }
                } catch (err) {
                    setError("Ocurrió un error al cargar los datos del cliente.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchClient();
        }
    }, [clientId]);
    
    const handleSuccess = () => {
        router.push('/dashboard/clients');
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Editar Cliente
                </h1>
                 <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver Atrás
                </Button>
            </div>

            {isLoading && (
                 <div className="flex items-center justify-center p-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
            )}
            
            {error && <p className="text-destructive">{error}</p>}

            {!isLoading && client && (
                 <ClientForm clientId={clientId} initialData={client} onSuccess={handleSuccess} />
            )}
        </div>
    );
}
