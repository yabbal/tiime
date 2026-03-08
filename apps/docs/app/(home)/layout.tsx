import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<HomeLayout
			nav={{
				title: (
					<span className="font-bold text-lg tracking-tight">
						Tiime CLI
					</span>
				),
			}}
			links={[
				{ text: "Documentation", url: "/docs" },
				{
					text: "GitHub",
					url: "https://github.com/yabbal/tiime-cli",
				},
			]}
			githubUrl="https://github.com/yabbal/tiime-cli"
		>
			{children}
		</HomeLayout>
	);
}
