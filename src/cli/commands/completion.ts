import { defineCommand } from "citty";

const commands: Record<
	string,
	{ description: string; subs: Record<string, string> }
> = {
	auth: {
		description: "Gestion de l'authentification",
		subs: {
			login: "Se connecter",
			logout: "Se déconnecter",
			status: "Statut de connexion",
		},
	},
	company: {
		description: "Gestion de l'entreprise",
		subs: {
			list: "Lister les entreprises",
			get: "Détails de l'entreprise active",
			use: "Définir l'entreprise active",
			me: "Info utilisateur",
		},
	},
	invoices: {
		description: "Gestion des factures",
		subs: {
			list: "Lister les factures",
			get: "Détails d'une facture",
			create: "Créer une facture",
			duplicate: "Dupliquer une facture",
			update: "Modifier une facture",
			send: "Envoyer par email",
			pdf: "Télécharger le PDF",
			delete: "Supprimer un brouillon",
		},
	},
	clients: {
		description: "Gestion des clients",
		subs: {
			list: "Lister les clients",
			get: "Détails d'un client",
			create: "Créer un client",
			search: "Rechercher un client",
		},
	},
	bank: {
		description: "Comptes et transactions",
		subs: {
			accounts: "Comptes bancaires",
			balance: "Soldes des comptes",
			transactions: "Transactions bancaires",
			unimputed: "Transactions non imputées",
		},
	},
	quotations: {
		description: "Gestion des devis",
		subs: {
			list: "Lister les devis",
			get: "Détails d'un devis",
			create: "Créer un devis",
			pdf: "Télécharger le PDF",
			send: "Envoyer par email",
		},
	},
	expenses: {
		description: "Notes de frais",
		subs: {
			list: "Lister les notes de frais",
			get: "Détails d'une note de frais",
			create: "Créer une note de frais",
		},
	},
	documents: {
		description: "Gestion des documents",
		subs: {
			list: "Lister les documents",
			categories: "Catégories de documents",
			upload: "Uploader un justificatif",
			download: "Télécharger un document",
		},
	},
	labels: {
		description: "Labels et tags",
		subs: {
			list: "Labels personnalisés",
			standard: "Labels standards",
			tags: "Tags",
		},
	},
	status: {
		description: "Résumé rapide de la situation",
		subs: {},
	},
	open: {
		description: "Ouvrir Tiime dans le navigateur",
		subs: {},
	},
	version: {
		description: "Afficher la version",
		subs: {},
	},
	completion: {
		description: "Script d'autocomplétion",
		subs: {},
	},
};

const topLevelNames = Object.keys(commands);
const commonFlags = ["--format", "--id", "--all"];

const generateZsh = (): string => {
	const esc = (s: string) => s.replace(/'/g, "'\\''");

	const subcases = topLevelNames
		.filter((cmd) => Object.keys(commands[cmd].subs).length > 0)
		.map((cmd) => {
			const subs = Object.entries(commands[cmd].subs)
				.map(([name, desc]) => `'${name}:${esc(desc)}'`)
				.join(" ");
			return `\t\t\t${cmd})\n\t\t\t\tlocal -a subcmds\n\t\t\t\tsubcmds=(${subs})\n\t\t\t\t_describe 'sous-commande' subcmds\n\t\t\t\t;;`;
		})
		.join("\n");

	return `#compdef tiime

_tiime() {
\tlocal -a top_commands
\ttop_commands=(
${topLevelNames.map((c) => `\t\t'${c}:${esc(commands[c].description)}'`).join("\n")}
\t)

\tif (( CURRENT == 2 )); then
\t\t_describe 'commande' top_commands
\t\treturn
\tfi

\tlocal cmd="\${words[2]}"

\tif (( CURRENT == 3 )); then
\t\tcase "$cmd" in
${subcases}
\t\tesac
\t\treturn
\tfi

\t# Position 4+ : proposer les flags courants
\t_arguments \\
\t\t'--format[Format de sortie (json, table, csv)]' \\
\t\t'--id[Identifiant de la ressource]' \\
\t\t'--all[Récupérer tous les résultats]'
}

compdef _tiime tiime
`;
};

const generateBash = (): string => {
	const subcases = topLevelNames
		.filter((cmd) => Object.keys(commands[cmd].subs).length > 0)
		.map((cmd) => {
			const subs = Object.keys(commands[cmd].subs).join(" ");
			return `\t\t\t${cmd})\n\t\t\t\tCOMPREPLY=( $(compgen -W "${subs}" -- "$cur") )\n\t\t\t\treturn\n\t\t\t\t;;`;
		})
		.join("\n");

	return `_tiime() {
\tlocal cur prev cmd
\tcur="\${COMP_WORDS[COMP_CWORD]}"
\tprev="\${COMP_WORDS[COMP_CWORD-1]}"

\tif [[ \${COMP_CWORD} -eq 1 ]]; then
\t\tCOMPREPLY=( $(compgen -W "${topLevelNames.join(" ")}" -- "$cur") )
\t\treturn
\tfi

\tcmd="\${COMP_WORDS[1]}"

\tif [[ \${COMP_CWORD} -eq 2 ]]; then
\t\tcase "$cmd" in
${subcases}
\t\tesac
\t\treturn
\tfi

\t# Position 3+ : proposer les flags courants
\tCOMPREPLY=( $(compgen -W "${commonFlags.join(" ")}" -- "$cur") )
}

complete -F _tiime tiime
`;
};

const generateFish = (): string => {
	const esc = (s: string) => s.replace(/'/g, "\\'");

	const lines = [
		"# Disable file completions by default",
		"complete -c tiime -f",
		"",
		"# Top-level commands",
		...topLevelNames.map(
			(cmd) =>
				`complete -c tiime -n '__fish_use_subcommand' -a '${cmd}' -d '${esc(commands[cmd].description)}'`,
		),
		"",
		"# Subcommands",
	];

	for (const cmd of topLevelNames) {
		const subs = commands[cmd].subs;
		const subNames = Object.keys(subs);
		if (subNames.length > 0) {
			// Only show subcommands when the parent command is selected and no subcommand yet
			const condition = `__fish_seen_subcommand_from ${cmd}; and not __fish_seen_subcommand_from ${subNames.join(" ")}`;
			for (const [sub, desc] of Object.entries(subs)) {
				lines.push(
					`complete -c tiime -n '${condition}' -a '${sub}' -d '${esc(desc)}'`,
				);
			}
			lines.push("");
		}
	}

	// Common flags after subcommand level
	lines.push("# Common flags");
	for (const cmd of topLevelNames) {
		const subNames = Object.keys(commands[cmd].subs);
		if (subNames.length > 0) {
			const condition = `__fish_seen_subcommand_from ${subNames.join(" ")}`;
			lines.push(
				`complete -c tiime -n '${condition}' -l format -d 'Format de sortie'`,
			);
			lines.push(
				`complete -c tiime -n '${condition}' -l id -d 'Identifiant de la ressource'`,
			);
			lines.push(
				`complete -c tiime -n '${condition}' -l all -d 'Récupérer tous les résultats'`,
			);
		}
	}

	return `${lines.join("\n")}\n`;
};

export const completionCommand = defineCommand({
	meta: {
		name: "completion",
		description: "Générer le script d'autocomplétion shell",
	},
	args: {
		shell: {
			type: "string",
			description: "Shell cible (zsh, bash, fish)",
			default: "zsh",
		},
	},
	run({ args }) {
		const shell = args.shell;

		switch (shell) {
			case "zsh":
				process.stdout.write(generateZsh());
				break;
			case "bash":
				process.stdout.write(generateBash());
				break;
			case "fish":
				process.stdout.write(generateFish());
				break;
			default:
				process.stderr.write(
					`Shell non supporté : ${shell}. Utilisez zsh, bash ou fish.\n`,
				);
				process.exit(1);
		}
	},
});
