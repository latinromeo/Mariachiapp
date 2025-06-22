import type { SVGProps } from "react";

export function GuitarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16.28 11.48c.32-.54.6-1.1.8-1.7a4.93 4.93 0 0 0 0-4.58 4.95 4.95 0 0 0-2.4-2.45c-.8-.33-1.63-.5-2.48-.5s-1.68.17-2.48.5a4.95 4.95 0 0 0-2.4 2.45 4.93 4.93 0 0 0 0 4.58c.2.6.48 1.16.8 1.7L2 22h20l-5.72-10.52Z" />
      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="m21 21-2-2" />
      <path d="m11 11 9-9" />
    </svg>
  );
}
