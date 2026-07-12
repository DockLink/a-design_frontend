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
    // Map bold requests to Medium — no Bold file ships with the app.
    {
      path: "../../app/fonts/aktiv-grotesk/AktivGrotesk-Medium.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../app/fonts/aktiv-grotesk/AktivGrotesk-Medium.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-aktiv-grotesk",
  display: "swap",
  fallback: [],
});
