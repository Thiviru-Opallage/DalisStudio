"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Footer from "./Footer";

interface LayoutWrapperProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export default function LayoutWrapper({
  children,
  hideFooter = false,
}: LayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const shouldHideFooter = hideFooter || isAdminRoute;

  return (
    <>
      {/* PAGE CONTENT */}
      <div className="flex-1 w-full">
        {children}
      </div>

      {/* FOOTER — shrink-0 prevents it from being squashed or hidden */}
      {!shouldHideFooter && (
        <div className="w-full shrink-0">
          <Footer />
        </div>
      )}
    </>
  );
}