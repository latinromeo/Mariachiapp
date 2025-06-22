import { EventForm } from "@/app/dashboard/events/event-form";

export default function NewEventPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
            Create New Event
        </h1>
       </div>
       <EventForm />
    </div>
  );
}
