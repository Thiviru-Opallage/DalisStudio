import localFont from "next/font/local";

export const sfPro = localFont({
  src: [
    {
      path: "../public/fonts/SFPro/SFProDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/SFPro/SFProDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/SFPro/SFProDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
});

export const editorsNote = localFont({
  src: [
    {
      path: "../public/fonts/EditorsNote/EditorsNote-HairlineItalic.woff2",
      weight: "200",
      style: "italic",
    },
  ],
  display: "swap",
});
