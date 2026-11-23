import type { ReactNode } from "react";
import "./globals.css";
export const metadata = { title: "WashFlow | Car Wash Management", description: "Simple car wash operations, customers and memberships." };
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
