import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IBCC - Hotelaria e Logística",
  description: "Sistema de Gestão de Mobiliário",
  icons: {
    icon: '/logo-ibcc.png?v=2',
    shortcut: '/logo-ibcc.png?v=2',
    apple: '/logo-ibcc.png?v=2',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-50 min-h-screen flex flex-col`}>
       {session && <Navbar userName={session.user?.name} userRole={(session.user as any)?.role} />}
        
        <main className="flex-grow">
          {children}
        </main>

        {/* Esse componente fica invisível aguardando a ordem para mostrar o aviso na tela */}
        <Toaster richColors position="top-right" /> 
      </body>
    </html>
  );
}