import type { Metadata } from "next";
import { AppNav } from "./AppNav";
import { WorkspaceProvider } from "@/frontend/context/WorkspaceContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "FYF AI Content Studio",
  description: "Personal FYF content studio with brand guidance, approval boundaries, and video handoff."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <WorkspaceProvider>
          <AppNav />
          <main className="main-content">
            {children}
          </main>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
