import {
	Code,
	FileText,
	Globe,
	Landmark,
	Receipt,
	Terminal,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { version } from "tiime-cli/package.json";

const features = [
	{
		icon: <Receipt className="size-5" />,
		title: "Factures & Devis",
		description:
			"Créer, dupliquer, envoyer et télécharger vos factures et devis en une commande.",
	},
	{
		icon: <Landmark className="size-5" />,
		title: "Banque",
		description:
			"Soldes, transactions, recherche et opérations non imputées — tout depuis le terminal.",
	},
	{
		icon: <Users className="size-5" />,
		title: "Clients",
		description:
			"Gérer votre base clients : création, recherche et consultation.",
	},
	{
		icon: <FileText className="size-5" />,
		title: "Documents",
		description:
			"Upload, téléchargement et organisation de vos pièces comptables.",
	},
	{
		icon: <Terminal className="size-5" />,
		title: "JSON natif",
		description:
			"Sortie JSON par défaut — idéal pour jq, scripts et agents IA.",
	},
	{
		icon: <Code className="size-5" />,
		title: "SDK TypeScript",
		description:
			"Utilisable comme librairie dans vos projets Node.js et TypeScript.",
	},
	{
		icon: <Zap className="size-5" />,
		title: "Retry intelligent",
		description: "Backoff exponentiel automatique sur les erreurs 429 et 5xx.",
	},
	{
		icon: <Globe className="size-5" />,
		title: "Bilingue",
		description:
			"Interface en français et anglais, détection automatique de la locale.",
	},
];

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col">
			{/* Hero */}
			<section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
				<div className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-secondary px-4 py-1.5 text-sm text-fd-muted-foreground mb-6">
					<Terminal className="size-3.5" />
					<span>v{version} — Open Source</span>
				</div>
				<p className="text-xs text-fd-muted-foreground/70 mb-4">
					Projet personnel et expérimental — non affilié à Tiime
				</p>
				<h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-fd-foreground to-fd-muted-foreground bg-clip-text text-transparent">
					Tiime CLI
				</h1>
				<p className="text-lg md:text-xl text-fd-muted-foreground max-w-2xl mb-10 leading-relaxed">
					Pilotez votre comptabilité{" "}
					<strong className="text-fd-foreground">Tiime</strong> depuis le
					terminal. CLI puissant, SDK TypeScript, sortie JSON native.
				</p>
				<div className="flex flex-wrap gap-4 justify-center">
					<Link
						href="/docs"
						className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-6 py-3 text-fd-primary-foreground font-semibold hover:opacity-90 transition-opacity"
					>
						Commencer
					</Link>
					<Link
						href="/docs/installation"
						className="inline-flex items-center gap-2 rounded-lg border border-fd-border px-6 py-3 font-semibold text-fd-foreground hover:bg-fd-accent transition-colors"
					>
						Installation
					</Link>
				</div>
			</section>

			{/* Quick install */}
			<section className="flex justify-center px-6 pb-16">
				<div className="w-full max-w-lg rounded-xl border border-fd-border bg-fd-card p-4 font-mono text-sm">
					<div className="flex items-center gap-2 text-fd-muted-foreground mb-3">
						<span className="size-3 rounded-full bg-red-500/80" />
						<span className="size-3 rounded-full bg-yellow-500/80" />
						<span className="size-3 rounded-full bg-green-500/80" />
					</div>
					<div className="space-y-1">
						<p>
							<span className="text-fd-muted-foreground">$</span>{" "}
							<span className="text-fd-primary">npm install -g tiime-cli</span>
						</p>
						<p>
							<span className="text-fd-muted-foreground">$</span> tiime auth
							login
						</p>
						<p>
							<span className="text-fd-muted-foreground">$</span> tiime status
						</p>
						<p className="text-fd-muted-foreground">
							✓ Connecté · 3 comptes · 12 factures en attente
						</p>
					</div>
				</div>
			</section>

			{/* Features grid */}
			<section className="px-6 pb-24">
				<div className="max-w-5xl mx-auto">
					<h2 className="text-2xl font-bold text-center mb-12">
						Tout ce dont vous avez besoin
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{features.map((feature) => (
							<div
								key={feature.title}
								className="rounded-xl border border-fd-border bg-fd-card p-5 hover:border-fd-primary/40 transition-colors"
							>
								<div className="inline-flex items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary p-2.5 mb-4">
									{feature.icon}
								</div>
								<h3 className="font-semibold mb-2">{feature.title}</h3>
								<p className="text-sm text-fd-muted-foreground leading-relaxed">
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>
		</main>
	);
}
