import type { Metadata } from "next";
import { business } from "@/config/business";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${business.schoolName} | Driving lessons`,
    template: `%s | ${business.schoolName}`,
  },
  description: business.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        {children}
      </body>
    </html>
  );
}
