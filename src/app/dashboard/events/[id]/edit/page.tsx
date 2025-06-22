
"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getEventById, type EventData } from "@/services/eventService";
import { EventForm } from "@/app/dashboard/events/event-form";
import { Loader2 } from "lucide-react";

export default function EditEventPage() {
    const params = useParams();
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
            <div className="flex items-center justify-between">
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Editar Evento
                </h1>
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
