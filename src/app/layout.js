import { Space_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata = {
  title: "MakeWithUs | Client Portal",
  description: "MakeWithUs Client Project Tracking Portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors expand={true} theme="system" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
