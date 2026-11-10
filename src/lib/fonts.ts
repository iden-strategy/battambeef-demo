import { Inter, Montserrat, Noto_Sans_Khmer } from "next/font/google";

// next/font downloads these at build time and serves them from our own domain.
export const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Not preloaded: the browser only downloads it when Khmer glyphs appear on the page.
export const notoSansKhmer = Noto_Sans_Khmer({
  subsets: ["khmer"],
  display: "swap",
  variable: "--font-noto-khmer",
  preload: false,
});

export const fontVariables = `${montserrat.variable} ${inter.variable} ${notoSansKhmer.variable}`;
