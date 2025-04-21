import { AuthProvider } from "@/lib/contexts/authContext";
import "./globals.css";

export default function RootLayout({ children}:Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}