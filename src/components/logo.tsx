
import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center justify-center py-2 px-4">
      <Image
        src="/logo.png"
        alt="Mariachi Reyes de México Logo"
        width={180}
        height={60}
        priority
        className="object-contain"
      />
    </div>
  )
}
