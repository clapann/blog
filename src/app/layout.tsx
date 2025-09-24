import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { validateRequiredEnv } from "@/lib/env";

const inter = Inter({
    subsets: ["latin"]
});

export const metadata: Metadata = {
    title: "steven's blog",
    description: "steven's personal blog"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
    validateRequiredEnv();
	
	return (
		<html lang="en">
			<body className={inter.className}>
				{children}
			</body>
		</html>
	);
}