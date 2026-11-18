import type { ReactNode } from "react";

// El <html> vive en app/[locale]/layout.tsx para poder poner el idioma correcto.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
