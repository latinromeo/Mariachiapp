
import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center justify-center p-4">
      <Image
        src="/logo.png?v=2"
        alt="Logo de Mariachi Reyes de México"
        width={180}
        height={60}
        priority
        className="object-contain"
      />
    </div>
  )
}
