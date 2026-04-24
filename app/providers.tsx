"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LayoutProvider } from "@/components/LayoutContext";
import { GreetingProvider } from "@/components/GreetingProvider";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LayoutProvider>
          <GreetingProvider>{children}</GreetingProvider>
        </LayoutProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
