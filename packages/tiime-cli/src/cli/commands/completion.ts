import type { CommandDef, SubCommandsDef } from "citty";
import { defineCommand } from "citty";

type CommandInfo = {
	description: string;
	subs: Record<string, string>;
};

const resolveCommand = (
	cmd: CommandDef | (() => Promise<CommandDef>),
): CommandDef | undefined => {
	// Only handle already-resolved CommandDef objects (not lazy imports)
	if (typeof cmd === "function") return undefined;
	return cmd;
};

const extractCommands = (
	subCommands: SubCommandsDef,
): Record<string, CommandInfo> => {
	const result: Record<string, CommandInfo> = {};

	for (const [name, rawCmd] of Object.entries(subCommands)) {
		const cmd = resolveCommand(
			rawCmd as CommandDef | (() => Promise<CommandDef>),
		);
		if (!cmd) continue;

		const meta = cmd.meta as { description?: string } | undefined;
		const description = meta?.description ?? name;
		const subs: Record<string, string> = {};

		if (cmd.subCommands && typeof cmd.subCommands === "object") {
			for (const [subName, rawSub] of Object.entries(
				cmd.subCommands as SubCommandsDef,
			)) {
				const sub = resolveCommand(
					rawSub as CommandDef | (() => Promise<CommandDef>),
				);
				const subMeta = sub?.meta as { description?: string } | undefined;
				subs[subName] = subMeta?.description ?? subName;
			}
		}

		result[name] = { description, subs };
	}

	return result;
};

const commonFlags = ["--format", "--id", "--all"];

const generateZsh = (commands: Record<string, CommandInfo>): string => {
	const esc = (s: string) => s.replace(/'/g, "'\\''");
	const topLevelNames = Object.keys(commands);

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

const generateBash = (commands: Record<string, CommandInfo>): string => {
	const topLevelNames = Object.keys(commands);

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

const generateFish = (commands: Record<string, CommandInfo>): string => {
	const esc = (s: string) => s.replace(/'/g, "\\'");
	const topLevelNames = Object.keys(commands);

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
			const condition = `__fish_seen_subcommand_from ${cmd}; and not __fish_seen_subcommand_from ${subNames.join(" ")}`;
			for (const [sub, desc] of Object.entries(subs)) {
				lines.push(
					`complete -c tiime -n '${condition}' -a '${sub}' -d '${esc(desc)}'`,
				);
			}
			lines.push("");
		}
	}

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

export const createCompletionCommand = (subCommands: SubCommandsDef) => {
	const commands = extractCommands(subCommands);

	// Add completion itself
	commands.completion = {
		description: "Générer le script d'autocomplétion shell",
		subs: {},
	};

	return defineCommand({
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
					process.stdout.write(generateZsh(commands));
					break;
				case "bash":
					process.stdout.write(generateBash(commands));
					break;
				case "fish":
					process.stdout.write(generateFish(commands));
					break;
				default:
					process.stderr.write(
						`Shell non supporté : ${shell}. Utilisez zsh, bash ou fish.\n`,
					);
					process.exit(1);
			}
		},
	});
};
