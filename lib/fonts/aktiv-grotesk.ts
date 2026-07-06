import localFont from "next/font/local";

export const aktivGrotesk = localFont({
  src: [
    {
      path: "../../app/fonts/aktiv-grotesk/AktivGrotesk-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../app/fonts/aktiv-grotesk/AktivGrotesk-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../app/fonts/aktiv-grotesk/AktivGrotesk-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-aktiv-grotesk",
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});
