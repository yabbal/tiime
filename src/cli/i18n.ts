// French → English description mapping for TIIME_LANG=en support
const descriptionTranslations: Record<string, string> = {
	// Main
	"CLI pour la comptabilité Tiime — sortie JSON pour agents IA":
		"CLI for Tiime accounting — JSON output for AI agents",

	// Top-level commands
	"Gestion de l'authentification": "Authentication management",
	"Gestion de l'entreprise": "Company management",
	"Gestion des factures": "Invoice management",
	"Gestion des clients": "Client management",
	"Comptes bancaires et transactions": "Bank accounts and transactions",
	"Gestion des devis": "Quotation management",
	"Gestion des notes de frais": "Expense report management",
	"Gestion des documents": "Document management",
	"Gestion des labels et tags": "Label and tag management",
	"Audit comptable multi-entreprises": "Multi-company accounting audit",
	"Résumé rapide de la situation": "Quick status summary",
	"Ouvrir Tiime dans le navigateur": "Open Tiime in browser",
	"Afficher la version": "Show version",
	"Générer le script d'autocomplétion shell":
		"Generate shell completion script",

	// Common subcommands
	"Se connecter à Tiime": "Log in to Tiime",
	"Se déconnecter de Tiime": "Log out from Tiime",
	"Afficher le statut d'authentification": "Show authentication status",
	"Lister les entreprises": "List companies",
	"Lister toutes les entreprises": "List all companies",
	"Détails de l'entreprise active": "Active company details",
	"Définir l'entreprise active": "Set active company",
	"Info utilisateur": "User info",
	"Info utilisateur courant (inclut active_company)":
		"Current user info (includes active_company)",
	"Lister les factures": "List invoices",
	"Détails d'une facture": "Invoice details",
	"Créer une facture (brouillon par défaut)":
		"Create an invoice (draft by default)",
	"Dupliquer une facture existante en brouillon":
		"Duplicate an invoice as draft",
	"Mettre à jour une facture": "Update an invoice",
	"Envoyer une facture par email": "Send an invoice by email",
	"Télécharger le PDF d'une facture": "Download invoice PDF",
	"Supprimer une facture brouillon": "Delete a draft invoice",
	"Lister les clients": "List clients",
	"Détails d'un client": "Client details",
	"Créer un client": "Create a client",
	"Rechercher un client": "Search for a client",
	"Afficher les soldes des comptes": "Show account balances",
	"Lister les comptes bancaires": "List bank accounts",
	"Lister les transactions bancaires": "List bank transactions",
	"Transactions non imputées": "Unmatched transactions",
	"Lister les devis": "List quotations",
	"Détails d'un devis": "Quotation details",
	"Créer un devis": "Create a quotation",
	"Télécharger le PDF d'un devis": "Download quotation PDF",
	"Envoyer un devis par email": "Send a quotation by email",
	"Lister les notes de frais": "List expense reports",
	"Détails d'une note de frais": "Expense report details",
	"Créer une note de frais": "Create an expense report",
	"Lister les documents": "List documents",
	"Lister les catégories de documents": "List document categories",
	"Uploader un justificatif": "Upload a receipt",
	"Télécharger un document": "Download a document",
	"Labels personnalisés": "Custom labels",
	"Lister les labels personnalisés": "List custom labels",
	"Labels standards": "Standard labels",
	"Lister les labels standards": "List standard labels",
	Tags: "Tags",
	"Lister les tags": "List tags",

	// Arg descriptions
	"Format de sortie (json, table, csv)": "Output format (json, table, csv)",
	"ID de la facture": "Invoice ID",
	"ID du client": "Client ID",
	"ID du devis": "Quotation ID",
	"ID de la facture source": "Source invoice ID",
	"ID de la facture à supprimer": "Invoice ID to delete",
	"ID du document": "Document ID",
	"Nom du client": "Client name",
	"Nom du client (si pas de client-id)": "Client name (if no client-id)",
	"Date d'émission (YYYY-MM-DD, défaut : aujourd'hui)":
		"Issue date (YYYY-MM-DD, default: today)",
	"Titre de la facture": "Invoice title",
	"Description de la ligne (ligne simple)": "Line description (single line)",
	"Quantité (ligne simple)": "Quantity (single line)",
	"Prix unitaire HT (ligne simple)": "Unit price excl. tax (single line)",
	"Code unité (day, hour, unit, etc.)": "Unit code (day, hour, unit, etc.)",
	"Code TVA (normal=20%, reduced=10%, super_reduced=5.5%, none=0%)":
		"VAT code (normal=20%, reduced=10%, super_reduced=5.5%, none=0%)",
	'Multi-lignes en JSON : \'[{"description":"Dev","quantity":20,"unit_price":540,"unit":"day"}]\'':
		'Multi-line JSON: \'[{"description":"Dev","quantity":20,"unit_price":540,"unit":"day"}]\'',
	"Champ libre (ex : référence contrat)":
		"Free field (e.g.: contract reference)",
	"Statut : draft (défaut) ou saved (numérotée)":
		"Status: draft (default) or saved (numbered)",
	"Prévisualiser le payload sans créer la facture":
		"Preview payload without creating invoice",
	"Adresse email du destinataire": "Recipient email address",
	"Objet de l'email": "Email subject",
	"Corps du message": "Message body",
	"Chemin de sortie du fichier": "Output file path",
	"Adresse email": "Email address",
	"Mot de passe": "Password",
	"ID de l'entreprise": "Company ID",
	"Tri champ:direction (ex: invoice_number:desc)":
		"Sort field:direction (e.g.: invoice_number:desc)",
	"Filtrer par statut (draft, saved, sent, paid)":
		"Filter by status (draft, saved, sent, paid)",
	"Numéro de page": "Page number",
	"Éléments par page": "Items per page",
	"Récupérer toutes les pages": "Fetch all pages",
	"Inclure les clients archivés": "Include archived clients",
	"Adresse du client": "Client address",
	"Code postal": "Postal code",
	Ville: "City",
	"Numéro de téléphone": "Phone number",
	"SIREN ou SIRET": "SIREN or SIRET",
	"Client professionnel": "Professional client",
	"Terme de recherche": "Search term",
	"Uniquement les comptes actifs": "Active accounts only",
	"Filtrer par ID de compte bancaire": "Filter by bank account ID",
	"Masquer les transactions refusées": "Hide refused transactions",
	"Tri champ:direction (ex: date:desc)":
		"Sort field:direction (e.g.: date:desc)",
	"Date de début (YYYY-MM-DD)": "Start date (YYYY-MM-DD)",
	"Date de fin (YYYY-MM-DD)": "End date (YYYY-MM-DD)",
	"Rechercher par libellé": "Search by label",
	"Tri champ:direction": "Sort field:direction",
	"Type de document (ex: receipt)": "Document type (e.g.: receipt)",
	"Source du document (ex: accountant)": "Document source (e.g.: accountant)",
	"Chemin du fichier à uploader": "File path to upload",
	"Type de document": "Document type",
	"Shell cible (zsh, bash, fish)": "Target shell (zsh, bash, fish)",
	"Nouveau titre de la facture": "New invoice title",
	"Nouveau statut (draft, saved)": "New status (draft, saved)",
	"Nouvelle date d'émission (YYYY-MM-DD)": "New issue date (YYYY-MM-DD)",
	"Nouveau champ libre": "New free field",
	"Date d'émission de la copie (YYYY-MM-DD, défaut : aujourd'hui)":
		"Copy issue date (YYYY-MM-DD, default: today)",
	"Remplacer la quantité pour toutes les lignes":
		"Replace quantity for all lines",
	"Section à ouvrir (invoices, quotations, clients, bank, documents, expenses)":
		"Section to open (invoices, quotations, clients, bank, documents, expenses)",
	"Nom de la note de frais": "Expense report name",
	"Date (YYYY-MM-DD)": "Date (YYYY-MM-DD)",
	"Titre du devis": "Quotation title",
	"Traiter toutes les entreprises": "Process all companies",
	"Entreprise(s) cible(s) (ID ou nom, séparés par des virgules)":
		"Target company(ies) (ID or name, comma-separated)",
	"Appliquer les corrections automatiques (imputation auto)":
		"Apply automatic fixes (auto-imputation)",
};

const frameworkTranslations: Record<string, Record<string, string>> = {
	fr: {
		USAGE: "UTILISATION",
		COMMANDS: "COMMANDES",
		OPTIONS: "OPTIONS",
		ARGUMENTS: "ARGUMENTS",
		"(required)": "(requis)",
		"Use %cmd% for more information about a command.":
			"Utilisez %cmd% pour plus d'informations sur une commande.",
	},
	en: {},
};

export const getLang = (): string => {
	// Explicit env var takes priority
	if (process.env.TIIME_LANG) return process.env.TIIME_LANG;

	// Detect system language (LANG=fr_FR.UTF-8, LC_ALL, LANGUAGE)
	const sysLang =
		process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || "";
	if (sysLang.startsWith("fr")) return "fr";
	if (sysLang.startsWith("en")) return "en";

	// Default to French
	return "fr";
};

export const translateHelp = (text: string): string => {
	const lang = getLang();
	let result = text;

	// For French: translate citty framework strings (USAGE → UTILISATION, etc.)
	if (lang === "fr") {
		const dict = frameworkTranslations.fr;
		for (const [en, fr] of Object.entries(dict)) {
			if (en.includes("%cmd%")) continue;
			result = result.replaceAll(en, fr);
		}
		const usePattern = /Use (.*) for more information about a command\./g;
		const useReplacement =
			dict["Use %cmd% for more information about a command."];
		if (useReplacement) {
			result = result.replace(usePattern, (_match, cmd) =>
				useReplacement.replace("%cmd%", cmd),
			);
		}
	}

	// For English: translate French descriptions to English
	if (lang === "en") {
		for (const [fr, en] of Object.entries(descriptionTranslations)) {
			result = result.replaceAll(fr, en);
		}
	}

	return result;
};
