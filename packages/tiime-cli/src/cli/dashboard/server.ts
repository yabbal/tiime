import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import type { TiimeClient } from "tiime-sdk";
import { createClient } from "../config";
import { dashboardHtml } from "./html";

const json = (res: ServerResponse, data: unknown, status = 200) => {
	res.writeHead(status, {
		"Content-Type": "application/json",
		"Access-Control-Allow-Origin": "*",
	});
	res.end(JSON.stringify(data));
};

const html = (res: ServerResponse, content: string) => {
	res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
	res.end(content);
};

const getClientForCompany = (companyId: number): TiimeClient =>
	createClient(companyId);

const handleApi = async (path: string, res: ServerResponse) => {
	const parts = path.replace(/^\/api\//, "").split("/");

	if (parts[0] === "companies") {
		const client = createClient(0);
		const companies = await client.listCompanies();
		return json(res, companies);
	}

	if (parts[0] === "company" && parts[1]) {
		const companyId = Number(parts[1]);
		const client = getClientForCompany(companyId);

		const resource = parts[2];

		if (!resource || resource === "info") {
			const company = await client.company.get();
			return json(res, company);
		}

		if (resource === "overview") {
			const [
				accounts,
				draftInvoices,
				unpaidInvoices,
				allInvoices,
				unimputed,
				allTransactions,
				clients,
				quotations,
			] = await Promise.all([
				client.bankAccounts.list(true),
				client.invoices.list({ status: "draft" }),
				client.invoices.list({ status: "sent" }),
				client.invoices.listAll(),
				client.bankTransactions.unimputed(),
				client.bankTransactions.listAll(),
				client.clients.list(),
				client.quotations.list(),
			]);

			const totalBalance = accounts.reduce(
				(sum, a) => sum + a.balance_amount,
				0,
			);
			const unpaidTotal = unpaidInvoices.reduce(
				(sum, i) => sum + i.total_including_taxes,
				0,
			);
			const pendingQuotations = quotations.filter(
				(q) => q.status !== "accepted" && q.status !== "declined",
			);
			const pendingQuotationsTotal = pendingQuotations.reduce(
				(sum, q) => sum + q.amount_including_taxes,
				0,
			);

			// Global metrics
			const paidInvoices = allInvoices.filter((i) => i.status !== "draft");
			const totalRevenue = paidInvoices.reduce(
				(sum, i) => sum + i.total_including_taxes,
				0,
			);
			const totalRevenueHT = paidInvoices.reduce(
				(sum, i) => sum + i.total_excluding_taxes,
				0,
			);

			const inflows = allTransactions.filter((t) => t.amount > 0);
			const outflows = allTransactions.filter((t) => t.amount < 0);
			const totalInflows = inflows.reduce((sum, t) => sum + t.amount, 0);
			const totalOutflows = outflows.reduce((sum, t) => sum + t.amount, 0);

			// Monthly revenue breakdown (last 12 months)
			const monthlyRevenue: Record<string, number> = {};
			const monthlyExpenses: Record<string, number> = {};
			for (const t of allTransactions) {
				const date = t.transaction_date || t.realization_date;
				if (!date) continue;
				const key = date.slice(0, 7); // YYYY-MM
				if (t.amount > 0) {
					monthlyRevenue[key] = (monthlyRevenue[key] || 0) + t.amount;
				} else {
					monthlyExpenses[key] =
						(monthlyExpenses[key] || 0) + Math.abs(t.amount);
				}
			}

			// Get last 12 months sorted
			const allMonths = [
				...new Set([
					...Object.keys(monthlyRevenue),
					...Object.keys(monthlyExpenses),
				]),
			].sort();
			const last12 = allMonths.slice(-12);

			return json(res, {
				treasury: {
					total_balance: totalBalance,
					accounts: accounts.map((a) => ({
						id: a.id,
						name: a.name,
						bank: a.bank.name,
						balance: a.balance_amount,
						currency: a.balance_currency,
						balance_date: a.balance_date,
						iban: a.iban,
					})),
				},
				invoices: {
					drafts: draftInvoices.length,
					unpaid_count: unpaidInvoices.length,
					unpaid_total: unpaidTotal,
					unpaid: unpaidInvoices.map((i) => ({
						id: i.id,
						number: i.compiled_number,
						client: i.client_name,
						amount: i.total_including_taxes,
						due_date: i.due_date,
						emission_date: i.emission_date,
					})),
				},
				quotations: {
					pending_count: pendingQuotations.length,
					pending_total: pendingQuotationsTotal,
				},
				bank: {
					unimputed_count: unimputed.length,
				},
				clients: {
					total: clients.length,
				},
				global: {
					total_invoices: allInvoices.length,
					total_revenue_ttc: totalRevenue,
					total_revenue_ht: totalRevenueHT,
					total_transactions: allTransactions.length,
					total_inflows: totalInflows,
					total_outflows: totalOutflows,
					net_cashflow: totalInflows + totalOutflows,
					monthly: last12.map((m) => ({
						month: m,
						inflows: monthlyRevenue[m] || 0,
						outflows: monthlyExpenses[m] || 0,
					})),
				},
			});
		}

		if (resource === "bank-accounts") {
			const accounts = await client.bankAccounts.list(true);
			return json(res, accounts);
		}

		if (resource === "invoices") {
			const status = parts[3] as "draft" | "sent" | undefined;
			const invoices = await client.invoices.listAll({ status });
			return json(res, invoices);
		}

		return json(res, { error: `Unknown resource: ${resource}` }, 404);
	}

	return json(res, { error: "Not found" }, 404);
};

const handleRequest = async (req: IncomingMessage, res: ServerResponse) => {
	const url = req.url ?? "/";

	if (url.startsWith("/api/")) {
		try {
			await handleApi(url, res);
		} catch (e) {
			const message = e instanceof Error ? e.message : "Internal server error";
			json(res, { error: message }, 500);
		}
		return;
	}

	html(res, dashboardHtml);
};

export const startDashboardServer = (
	port: number,
): Promise<ReturnType<typeof createServer>> =>
	new Promise((resolve, reject) => {
		const server = createServer(handleRequest);
		server.on("error", (err: NodeJS.ErrnoException) => {
			if (err.code === "EADDRINUSE") {
				reject(new Error(`Port ${port} already in use`));
			} else {
				reject(err);
			}
		});
		server.listen(port, "127.0.0.1", () => resolve(server));
	});
