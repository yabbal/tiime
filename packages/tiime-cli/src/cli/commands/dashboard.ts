import { exec } from "node:child_process";
import { defineCommand } from "citty";
import consola from "consola";
import { startDashboardServer } from "../dashboard/server";

const DEFAULT_PORT = 3141;

export const dashboardCommand = defineCommand({
	meta: {
		name: "dashboard",
		description: "Ouvrir le dashboard financier dans le navigateur",
	},
	args: {
		port: {
			type: "string",
			description: `Port du serveur local (défaut: ${DEFAULT_PORT})`,
			required: false,
		},
		"no-open": {
			type: "boolean",
			description: "Ne pas ouvrir le navigateur automatiquement",
			default: false,
		},
	},
	async run({ args }) {
		const port = args.port ? Number(args.port) : DEFAULT_PORT;
		const url = `http://localhost:${port}`;

		try {
			console.error("Démarrage du serveur dashboard...");
			await startDashboardServer(port);
			console.error(`\n  Dashboard disponible sur ${url}\n`);

			if (!args["no-open"]) {
				exec(`open "${url}"`);
				console.error("  Navigateur ouvert.");
			}

			console.error("  Appuyez sur Ctrl+C pour arrêter.\n");
		} catch (e) {
			const message = e instanceof Error ? e.message : "Erreur inconnue";
			consola.error(message);
			process.exit(1);
		}
	},
});
