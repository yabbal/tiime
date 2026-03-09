import {
	ArrowRight,
	Bot,
	Code,
	FileText,
	Globe,
	Landmark,
	Package,
	Receipt,
	Terminal,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";

const sdkExample = `import { TiimeClient } from "tiime-sdk";

const client = new TiimeClient();

const invoices = await client.invoices.list({ status: "paid" });
const balances = await client.bankAccounts.balance();`;

const cliExample = `$ tiime invoices list --status paid --format table

 ID   | Client     | Total    | Statut
------+------------+----------+--------
 142  | ACME Corp  | 4 000 €  | paid
 138  | Dupont SAS | 2 700 €  | paid`;

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col">
			{/* Hero */}
			<section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20">
				<div className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-secondary px-4 py-1.5 text-sm text-fd-muted-foreground mb-6">
					<Package className="size-3.5" />
					<span>Open Source</span>
				</div>
				<h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-fd-foreground to-fd-muted-foreground/70 bg-clip-text text-transparent">
					Tiime
				</h1>
				<p className="text-lg md:text-xl text-fd-muted-foreground max-w-2xl mb-4 leading-relaxed">
					SDK TypeScript & CLI pour la comptabilite{" "}
					<strong className="text-fd-foreground">Tiime</strong>.
					<br />
					Integrez et pilotez votre compta en quelques lignes.
				</p>
				<p className="text-xs text-fd-muted-foreground/60 mb-10">
					Projet personnel et experimental — non affilie a Tiime
				</p>
				<div className="flex flex-wrap gap-4 justify-center">
					<Link
						href="/docs"
						className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-6 py-3 text-fd-primary-foreground font-semibold hover:opacity-90 transition-opacity"
					>
						Commencer
						<ArrowRight className="size-4" />
					</Link>
					<Link
						href="/docs/sdk"
						className="inline-flex items-center gap-2 rounded-lg border border-fd-border px-6 py-3 font-semibold text-fd-foreground hover:bg-fd-accent transition-colors"
					>
						<Code className="size-4" />
						SDK
					</Link>
					<Link
						href="/docs/cli"
						className="inline-flex items-center gap-2 rounded-lg border border-fd-border px-6 py-3 font-semibold text-fd-foreground hover:bg-fd-accent transition-colors"
					>
						<Terminal className="size-4" />
						CLI
					</Link>
				</div>
			</section>

			{/* Two products side by side */}
			<section className="px-6 pb-20">
				<div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* SDK card */}
					<Link
						href="/docs/sdk"
						className="group rounded-xl border border-fd-border bg-fd-card p-6 hover:border-fd-primary/50 transition-all"
					>
						<div className="flex items-center gap-3 mb-4">
							<div className="inline-flex items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary p-2.5">
								<Code className="size-5" />
							</div>
							<div>
								<h2 className="text-lg font-bold">tiime-sdk</h2>
								<p className="text-xs text-fd-muted-foreground font-mono">
									npm install tiime-sdk
								</p>
							</div>
						</div>
						<div className="rounded-lg bg-fd-secondary/50 p-4 font-mono text-xs leading-relaxed mb-4 overflow-x-auto">
							<pre className="text-fd-foreground/90">{sdkExample}</pre>
						</div>
						<p className="text-sm text-fd-muted-foreground leading-relaxed">
							Integrez Tiime dans vos applications TypeScript. Auth autonome,
							10 ressources typees, retry intelligent.
						</p>
						<span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-fd-primary group-hover:gap-2 transition-all">
							Documentation SDK
							<ArrowRight className="size-3.5" />
						</span>
					</Link>

					{/* CLI card */}
					<Link
						href="/docs/cli"
						className="group rounded-xl border border-fd-border bg-fd-card p-6 hover:border-fd-primary/50 transition-all"
					>
						<div className="flex items-center gap-3 mb-4">
							<div className="inline-flex items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary p-2.5">
								<Terminal className="size-5" />
							</div>
							<div>
								<h2 className="text-lg font-bold">tiime-cli</h2>
								<p className="text-xs text-fd-muted-foreground font-mono">
									npm install -g tiime-cli
								</p>
							</div>
						</div>
						<div className="rounded-lg bg-fd-secondary/50 p-4 font-mono text-xs leading-relaxed mb-4 overflow-x-auto">
							<pre className="text-fd-foreground/90">{cliExample}</pre>
						</div>
						<p className="text-sm text-fd-muted-foreground leading-relaxed">
							Pilotez votre compta depuis le terminal. 13 commandes, sortie
							JSON/table/CSV, bilingue FR/EN.
						</p>
						<span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-fd-primary group-hover:gap-2 transition-all">
							Documentation CLI
							<ArrowRight className="size-3.5" />
						</span>
					</Link>
				</div>
			</section>

			{/* Features grid */}
			<section className="px-6 pb-24">
				<div className="max-w-5xl mx-auto">
					<h2 className="text-2xl font-bold text-center mb-3">
						Tout ce dont vous avez besoin
					</h2>
					<p className="text-center text-fd-muted-foreground mb-12 max-w-lg mx-auto">
						Factures, banque, clients, documents — gerez toute votre
						comptabilite depuis votre code ou votre terminal.
					</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
						{[
							{
								icon: <Receipt className="size-5" />,
								title: "Factures & Devis",
								description:
									"Creer, dupliquer, envoyer et telecharger en PDF.",
							},
							{
								icon: <Landmark className="size-5" />,
								title: "Banque",
								description:
									"Soldes, transactions, imputation et rapprochement.",
							},
							{
								icon: <Users className="size-5" />,
								title: "Clients",
								description:
									"Base clients : creation, recherche et consultation.",
							},
							{
								icon: <FileText className="size-5" />,
								title: "Documents",
								description:
									"Upload, telechargement et organisation des justificatifs.",
							},
							{
								icon: <Code className="size-5" />,
								title: "TypeScript natif",
								description:
									"SDK type, autocompletion et 40+ interfaces TypeScript.",
							},
							{
								icon: <Zap className="size-5" />,
								title: "Retry intelligent",
								description:
									"Backoff exponentiel sur les erreurs 429 et 5xx.",
							},
							{
								icon: <Bot className="size-5" />,
								title: "Agents IA",
								description:
									"Skill Claude Code pour piloter Tiime par conversation.",
							},
							{
								icon: <Globe className="size-5" />,
								title: "Bilingue",
								description:
									"Interface CLI en francais et anglais, detection automatique.",
							},
						].map((feature) => (
							<div
								key={feature.title}
								className="rounded-xl border border-fd-border bg-fd-card p-5 hover:border-fd-primary/30 transition-colors"
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
