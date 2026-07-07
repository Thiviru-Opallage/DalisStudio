"use client";

import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full px-6 md:px-12 border-t select-none overflow-hidden" 
      style={{ 
        background: "var(--bg)",
        color: "var(--fg)",
        borderTopColor: "color-mix(in srgb, var(--fg) 15%, transparent)", 
      }} >
      
      {/* TOP ROW: Branding left, Social right */}
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-6 pt-10 pb-8">

        {/* LEFT: Branding & Copyright */}
        <div className="flex flex-col space-y-1.5">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-none uppercase">
            DALIS STUDIO<span className="text-[0.45em] font-medium align-super ml-0.5">TM</span>
          </h2>
          <div className="text-zinc-500 text-xs font-medium tracking-wide uppercase leading-relaxed">
            <p>© {currentYear} DALIS STUDIO.</p>
            <p>ALL RIGHTS RESERVED.</p>
          </div>
        </div>

        {/* RIGHT: Social */}
        <div className="flex flex-col items-start md:items-end space-y-3 shrink-0">
          <h4 className="text-zinc-500 text-xs font-bold tracking-[0.25em] uppercase">
            SOCIAL
          </h4>
          <div className="flex items-center gap-4 md:gap-5 pr-1">

            {/* Instagram — brand hover: #E1306C */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="transition-colors duration-300 [color:var(--fg)] hover:[color:#E1306C] shrink-0"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>

            {/* X (Twitter) — brand hover: #1DA1F2 */}
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="transition-colors duration-300 [color:var(--fg)] hover:[color:#1DA1F2] shrink-0"
            >
              <svg className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* LinkedIn — brand hover: #0A66C2 */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="transition-colors duration-300 [color:var(--fg)] hover:[color:#0A66C2] shrink-0"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>

            {/* Behance — brand hover: #1769FF */}
            <a
              href="https://behance.net"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Behance"
              className="transition-colors duration-300 [color:var(--fg)] hover:[color:#1769FF] shrink-0 grid place-items-center"
            >
              <svg
                className="w-7 h-7 md:w-8 md:h-8"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988H0V5.021h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zM3 9.975v2.05h2.969c1.588 0 1.588-2.05 0-2.05H3zm0 5.025v2.025h3.104c1.691 0 1.691-2.025 0-2.025H3z"/>
              </svg>
            </a>

          </div>
        </div>
      </div>
      
      {/* DIVIDER */}
      <div className="max-w-[1400px] mx-auto border-t" style={{ borderColor: "var(--fg)", opacity: 0.15 }} />

      {/* BOTTOM ROW: Developer credit centered, links to LinkedIn */}
      <div className="max-w-[1400px] mx-auto py-5 flex items-center justify-center">
        <a
          href="https://www.linkedin.com/in/thiviru-opallage"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-600 text-[8px] md:text-[8px] font-medium tracking-[0.15em] uppercase hover:text-zinc-400 transition-colors duration-300"
        >
          Developed by Thiviru Opallage
        </a>
      </div>

    </footer>
  );
}