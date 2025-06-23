
import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center justify-center">
      <Image
        src="/logo.svg"
        alt="Logo de Mariachi Reyes de México"
        width={120}
        height={40}
        priority
        className="object-contain"
      />
    </div>
  )
}
