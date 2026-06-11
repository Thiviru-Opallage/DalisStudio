import localFont from "next/font/local";

export const sfPro = localFont({
  src: [
    {
      path: "../app/fonts/SFPro/SFProDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../app/fonts/SFPro/SFProDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../app/fonts/SFPro/SFProDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sf-pro",   
  display: "swap",
});