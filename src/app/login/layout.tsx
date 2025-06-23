
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión - Mariachi Reyes',
  description: 'Acceso al panel de gestión de Mariachi Reyes.',
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
