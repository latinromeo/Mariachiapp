
import { RehearsalForm } from "@/app/dashboard/rehearsals/rehearsal-form";

export default function NewRehearsalPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
            Programar Nuevo Ensayo
        </h1>
       </div>
       <RehearsalForm />
    </div>
  );
}
