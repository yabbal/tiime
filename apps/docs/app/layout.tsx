import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import type { ReactNode } from "react";

export const metadata = {
	title: {
		default: "Tiime CLI",
		template: "%s | Tiime CLI",
	},
	description:
		"CLI & SDK TypeScript pour la comptabilité Tiime — pilotez votre compta depuis le terminal",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="fr" suppressHydrationWarning>
			<body className="flex flex-col min-h-screen">
				<RootProvider>{children}</RootProvider>
			</body>
		</html>
	);
}
