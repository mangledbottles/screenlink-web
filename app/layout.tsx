import "./css/style.css";

import { Inter } from "next/font/google";
import localFont from "next/font/local";
import AuthProvider from "./authProvider";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const hkgrotesk = localFont({
  src: [
    {
      path: "../public/fonts/HKGrotesk-Medium.woff2",
      weight: "500",
    },
    {
      path: "../public/fonts/HKGrotesk-Bold.woff2",
      weight: "700",
    },
    {
      path: "../public/fonts/HKGrotesk-ExtraBold.woff2",
      weight: "800",
    },
  ],
  variable: "--font-hkgrotesk",
  display: "swap",
});

export const metadata = {
  title: "ScreenLink",
  description: "Record a screen capture video and share it easily.",
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "stripe-pricing-table": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <html lang="en">
        <body
          className={`${inter.variable} ${hkgrotesk.variable} font-inter antialiased bg-slate-900 text-slate-200 tracking-tight overflow-x-hidden`}
        >
          <div className="flex flex-col min-h-screen overflow-hidden">
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </div>
          <Toaster />
          <script
            async
            src="https://js.stripe.com/v3/pricing-table.js"
            defer={true}
          ></script>
        </body>
      </html>
    </AuthProvider>
  );
}
