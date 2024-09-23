import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { createClient } from "@/utils/supabase/server";
import ServerNavBar from "../components/ServerNavBar";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Samana Cards",
  description: "Learn languages with flashcards",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const canInitSupabaseClient = () => {
    try {
      createClient();
      return true;
    } catch (e) {
      return false;
    }
  };

  const isSupabaseConnected = canInitSupabaseClient();

  return (
    <html lang="en" className={GeistSans.className}>
      <body className="bg-gray-100 text-gray-900 flex flex-col min-h-screen">
        {isSupabaseConnected && <ServerNavBar />}
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <ToastContainer />
      </body>
    </html>
  );
}
