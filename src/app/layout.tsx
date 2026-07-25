import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// v2 stylesheet FIRST so ./globals.css wins every specificity tie.
// react-ui/v2/styles.css is a one-line re-export of this exact file, so the
// react-ui dependency is not needed.
import "@copilotkit/react-core/v2/styles.css";
import "./globals.css";
import { ChatShell } from "@/components/chat-shell";
import { ColorSchemeSync } from "@/components/color-scheme-sync";
import { COLOR_SCHEME_BOOTSTRAP_SCRIPT } from "@/lib/color-scheme";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "vnstock-web",
  description: "Vietnamese stock market data and analytics",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Blocking: sets html.dark before first paint. CopilotKit v2 keys dark
            mode off a .dark ancestor only — react-core/dist/v2/index.css has no
            prefers-color-scheme rule at all. */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static, no interpolation
          dangerouslySetInnerHTML={{ __html: COLOR_SCHEME_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body className="min-h-dvh">
        <ColorSchemeSync />
        <ChatShell>{children}</ChatShell>
      </body>
    </html>
  );
}
