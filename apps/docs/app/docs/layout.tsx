import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<DocsLayout
			tree={source.getPageTree()}
			nav={{
				title: (
					<span className="font-bold text-lg tracking-tight">
						Tiime
					</span>
				),
				url: "/",
			}}
			sidebar={{
				defaultOpenLevel: 1,
			}}
			githubUrl="https://github.com/yabbal/tiime"
		>
			{children}
		</DocsLayout>
	);
}
