"use client";

import { ReactNode } from "react";
import Footer from "./Footer";

interface LayoutWrapperProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export default function LayoutWrapper({
  children,
  hideFooter = false,
}: LayoutWrapperProps) {
  return (
    <>
      {/* PAGE CONTENT */}
      <div className="flex-1 w-full">
        {children}
      </div>

      {/* FOOTER — shrink-0 prevents it from being squashed or hidden */}
      {!hideFooter && (
        <div className="w-full shrink-0">
          <Footer />
        </div>
      )}
    </>
  );
}