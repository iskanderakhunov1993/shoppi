import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Fraunces (the previous display face) has no Cyrillic glyphs at all, so
// every Russian heading on the site — nearly all of them — was silently
// falling back to the browser's default serif the whole time. Playfair
// Display keeps the same contrasty editorial character but actually
// covers Cyrillic.
const displayFont = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
});

// Utility face for the home hero's "receipt" — line items, prices, the
// running total — anywhere a real Russian receipt sets figures in a
// fixed-width face rather than the display serif.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Shoppi — витрина креатора",
  description: "Покупай у своих людей, не у алгоритма.",
};

// Runs before paint so a stored theme preference applies immediately —
// without this, the page would flash the system-default theme first.
const THEME_INIT_SCRIPT = `
  try {
    var t = localStorage.getItem("shoppi-theme");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${displayFont.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
