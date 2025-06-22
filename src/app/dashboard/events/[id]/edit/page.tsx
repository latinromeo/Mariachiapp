
"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEventById, type EventData } from "@/services/eventService";
import { EventForm } from "@/app/dashboard/events/event-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditEventPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;
    const [event, setEvent] = useState<EventData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (eventId) {
            const fetchEvent = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const data = await getEventById(eventId);
                    if (data) {
                        setEvent(data);
                    } else {
                        setError("No se pudo encontrar el evento.");
                    }
                } catch (err) {
                    setError("Ocurrió un error al cargar el evento.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchEvent();
        }
    }, [eventId]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Editar Evento
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

            {!isLoading && event && (
                 <EventForm eventId={eventId} initialData={event} />
            )}
        </div>
    );
}
