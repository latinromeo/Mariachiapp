
import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center justify-center py-2">
      <Image
        src="/logo.png"
        alt="Mariachi Reyes de México Logo"
        width={68}
        height={80}
        priority
      />
    </div>
  )
}
