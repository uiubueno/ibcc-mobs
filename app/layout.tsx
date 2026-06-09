import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/Sidebar";
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
      {/* Mudamos para xl:flex-row para a Sidebar ficar na lateral no PC e no topo no mobile */}
      <body className={`${inter.className} bg-slate-50 min-h-screen flex flex-col xl:flex-row`}>
       {session && <Navbar userName={session.user?.name} userRole={(session.user as any)?.role} />}
        
        {/* flex-1 garante que o conteúdo ocupe todo o resto da tela, e overflow-x-hidden impede que o site quebre pros lados */}
        <main className="flex-1 w-full overflow-x-hidden">
          {children}
        </main>

        {/* Esse componente fica invisível aguardando a ordem para mostrar o aviso na tela */}
        <Toaster richColors position="top-right" /> 
      </body>
    </html>
  );
}