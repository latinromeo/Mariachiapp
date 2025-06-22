import { GuitarIcon } from "@/components/icons";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <GuitarIcon className="h-6 w-6 text-primary" />
      <h1 className="text-lg font-bold text-sidebar-foreground">
        Mariachi App
      </h1>
    </div>
  );
}
