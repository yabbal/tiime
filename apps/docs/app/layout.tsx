import { RootProvider } from "fumadocs-ui/provider/next";
import SearchDialog from "@/components/search";
import "./global.css";
import type { ReactNode } from "react";

export const metadata = {
	title: {
		default: "Tiime",
		template: "%s | Tiime",
	},
	description:
		"SDK TypeScript & CLI pour la comptabilité Tiime — intégrez et pilotez votre compta en quelques lignes",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="fr" suppressHydrationWarning>
			<body className="flex flex-col min-h-screen">
				<RootProvider search={{ SearchDialog }}>
					{children}
				</RootProvider>
			</body>
		</html>
	);
}
