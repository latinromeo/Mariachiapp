
"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRehearsalById, type RehearsalData } from "@/services/eventService";
import { RehearsalForm } from "@/app/dashboard/rehearsals/rehearsal-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditRehearsalPage() {
    const params = useParams();
    const router = useRouter();
    const rehearsalId = params.id as string;
    const [rehearsal, setRehearsal] = useState<RehearsalData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (rehearsalId) {
            const fetchRehearsal = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const data = await getRehearsalById(rehearsalId);
                    if (data) {
                        setRehearsal(data);
                    } else {
                        setError("No se pudo encontrar el ensayo.");
                    }
                } catch (err) {
                    setError("Ocurrió un error al cargar los datos del ensayo.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchRehearsal();
        }
    }, [rehearsalId]);
    
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Editar Ensayo
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

            {!isLoading && rehearsal && (
                 <RehearsalForm rehearsalId={rehearsalId} initialData={rehearsal} />
            )}
        </div>
    );
}
