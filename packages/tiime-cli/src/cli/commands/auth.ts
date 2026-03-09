import * as p from "@clack/prompts";
import { defineCommand } from "citty";
import { createTokenManager } from "../config";
import { output, outputError } from "../output";

export const authCommand = defineCommand({
	meta: { name: "auth", description: "Gestion de l'authentification" },
	subCommands: {
		login: defineCommand({
			meta: { name: "login", description: "Se connecter à Tiime" },
			args: {
				email: {
					type: "string",
					description: "Adresse email",
				},
				password: {
					type: "string",
					description: "Mot de passe",
				},
			},
			async run({ args }) {
				const hasArgs = args.email && args.password;

				if (hasArgs) {
					// CI/script mode
					try {
						const tm = createTokenManager();
						await tm.login(args.email, args.password);
						const info = tm.getTokenInfo();
						output({
							status: "authenticated",
							email: info.email,
							expires_at: info.expiresAt?.toISOString(),
						});
					} catch (e) {
						outputError(e);
					}
					return;
				}

				// Interactive mode
				p.intro("Connexion à Tiime");

				const email = await p.text({
					message: "Adresse email",
					placeholder: "vous@example.com",
					validate: (value) => {
						if (!value || !value.includes("@")) return "Adresse email invalide";
					},
				});

				if (p.isCancel(email)) {
					p.cancel("Connexion annulée.");
					return;
				}

				const password = await p.password({
					message: "Mot de passe",
					validate: (value) => {
						if (!value) return "Le mot de passe est requis";
					},
				});

				if (p.isCancel(password)) {
					p.cancel("Connexion annulée.");
					return;
				}

				const s = p.spinner();
				s.start("Authentification en cours...");

				try {
					const tm = createTokenManager();
					await tm.login(email, password);
					const info = tm.getTokenInfo();
					s.stop("Authentification réussie");
					p.outro(`Connecté en tant que ${info.email ?? email}`);
				} catch (e) {
					s.stop("Authentification échouée");
					const message = e instanceof Error ? e.message : "Erreur inconnue";
					p.cancel(message);
				}
			},
		}),

		logout: defineCommand({
			meta: { name: "logout", description: "Se déconnecter de Tiime" },
			run() {
				const tm = createTokenManager();
				tm.logout();
				output({ status: "logged_out" });
			},
		}),

		status: defineCommand({
			meta: {
				name: "status",
				description: "Afficher le statut d'authentification",
			},
			run() {
				const tm = createTokenManager();
				const info = tm.getTokenInfo();
				output({
					authenticated: tm.isAuthenticated(),
					email: info.email,
					expires_at: info.expiresAt?.toISOString() ?? null,
				});
			},
		}),
	},
});
