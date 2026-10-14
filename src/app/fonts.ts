import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext"] });

/** Class names that expose the font CSS variables; put on <html>. */
export const fontClasses = `${geistSans.variable} ${geistMono.variable} antialiased`;
