import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import type { BankTransaction, Invoice, TiimeClient } from "tiime-sdk";
import { createClient } from "../config";
import { dashboardHtml } from "./html";
import { wrappedHtml } from "./wrapped";

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

const cleanWording = (wording: string): string =>
	wording
		.trim()
		.toLowerCase()
		.replace(/^(carte |vir |prlv |chq |ret dab )/i, "")
		.trim();

const computeWrappedStats = (
	invoices: Invoice[],
	transactions: BankTransaction[],
) => {
	const revenueTtc = invoices.reduce((s, i) => s + i.total_including_taxes, 0);
	const revenueHt = invoices.reduce((s, i) => s + i.total_excluding_taxes, 0);
	const invoicesCount = invoices.length;
	const avgInvoice = invoicesCount > 0 ? revenueTtc / invoicesCount : 0;

	let biggestInvoice = null;
	if (invoices.length > 0) {
		const max = invoices.reduce((prev, curr) =>
			curr.total_including_taxes > prev.total_including_taxes ? curr : prev,
		);
		biggestInvoice = {
			amount: max.total_including_taxes,
			client_name: max.client_name,
			number: max.compiled_number,
			date: max.emission_date,
		};
	}

	const clientRevenue: Record<string, number> = {};
	for (const i of invoices) {
		const name = i.client_name || "Sans client";
		clientRevenue[name] = (clientRevenue[name] || 0) + i.total_including_taxes;
	}
	const topClients = Object.entries(clientRevenue)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([name, amount]) => ({ name, amount }));

	const expenseCategories: Record<string, number> = {};
	for (const t of transactions) {
		if (t.amount >= 0) continue;
		const label =
			t.imputations[0]?.label?.name ||
			cleanWording(t.wording || t.original_wording || "Autre");
		expenseCategories[label] =
			(expenseCategories[label] || 0) + Math.abs(t.amount);
	}
	const topExpenses = Object.entries(expenseCategories)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([name, amount]) => ({ name, amount }));

	const monthlyMap: Record<string, { inflows: number; outflows: number }> = {};
	for (const t of transactions) {
		const d = t.transaction_date || t.realization_date;
		if (!d) continue;
		const key = d.slice(0, 7);
		if (!monthlyMap[key]) monthlyMap[key] = { inflows: 0, outflows: 0 };
		if (t.amount > 0) monthlyMap[key].inflows += t.amount;
		else monthlyMap[key].outflows += Math.abs(t.amount);
	}
	const monthly = Object.entries(monthlyMap)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([month, data]) => ({ month, ...data }));

	let bestMonth = null;
	let worstMonth = null;
	for (const m of monthly) {
		const net = m.inflows - m.outflows;
		if (!bestMonth || net > bestMonth.net)
			bestMonth = {
				month: m.month,
				net,
				inflows: m.inflows,
				outflows: m.outflows,
			};
		if (!worstMonth || net < worstMonth.net)
			worstMonth = {
				month: m.month,
				net,
				inflows: m.inflows,
				outflows: m.outflows,
			};
	}

	const totalInflows = transactions
		.filter((t) => t.amount > 0)
		.reduce((s, t) => s + t.amount, 0);
	const totalOutflows = Math.abs(
		transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0),
	);
	const inflowOutflowRatio =
		totalOutflows !== 0
			? totalInflows / totalOutflows
			: totalInflows > 0
				? -1
				: 0;

	return {
		revenue_ttc: revenueTtc,
		revenue_ht: revenueHt,
		invoices_count: invoicesCount,
		avg_invoice: avgInvoice,
		biggest_invoice: biggestInvoice,
		top_clients: topClients,
		top_expenses: topExpenses,
		best_month: bestMonth,
		worst_month: worstMonth,
		total_inflows: totalInflows,
		total_outflows: totalOutflows,
		inflow_outflow_ratio: inflowOutflowRatio,
		transactions_count: transactions.length,
		monthly,
	};
};

const handleApi = async (path: string, res: ServerResponse) => {
	const parts = path.replace(/^\/api\//, "").split("/");

	if (parts[0] === "companies") {
		const client = createClient(0);
		const companies = await client.listCompanies();
		return json(res, companies);
	}

	if (parts[0] === "wrapped") {
		const client = createClient(0);
		const allCompanies = await client.listCompanies();

		const allResults = await Promise.all(
			allCompanies.map(async (comp) => {
				const c = getClientForCompany(comp.id);
				const [company, invoices, transactions] = await Promise.all([
					c.company.get(),
					c.invoices.listAll(),
					c.bankTransactions.listAll(),
				]);
				return { company, invoices, transactions };
			}),
		);

		const mergedInvoices = allResults.flatMap((r) =>
			r.invoices.filter((i) => i.status !== "draft"),
		);
		const mergedTransactions = allResults.flatMap((r) => r.transactions);

		// Earliest start date across all companies
		const startDates = allResults
			.map((r) => r.company.activity_start_date || r.company.registration_date)
			.filter(Boolean)
			.sort();
		const earliestStart = startDates[0] || null;
		const now = new Date();
		const startMs = earliestStart
			? new Date(earliestStart).getTime()
			: now.getTime();
		const yearsActive = Math.max(
			1,
			Math.floor((now.getTime() - startMs) / (365.25 * 24 * 60 * 60 * 1000)) +
				1,
		);

		const yearSet = new Set<number>();
		for (const t of mergedTransactions) {
			const d = t.transaction_date || t.realization_date;
			if (d) yearSet.add(Number.parseInt(d.slice(0, 4), 10));
		}
		for (const i of mergedInvoices) {
			if (i.emission_date)
				yearSet.add(Number.parseInt(i.emission_date.slice(0, 4), 10));
		}
		const availableYears = [...yearSet].sort((a, b) => b - a);

		const computeStatsAll = computeWrappedStats;
		const allTimeStats = computeStatsAll(mergedInvoices, mergedTransactions);

		const years: Record<string, ReturnType<typeof computeWrappedStats>> = {};
		for (const year of availableYears) {
			const yearStr = String(year);
			years[yearStr] = computeStatsAll(
				mergedInvoices.filter(
					(i) => i.emission_date && i.emission_date.startsWith(yearStr),
				),
				mergedTransactions.filter((t) => {
					const d = t.transaction_date || t.realization_date;
					return d && d.startsWith(yearStr);
				}),
			);
		}

		return json(res, {
			company: {
				name: "Toutes les sociétés",
				registration_date: earliestStart,
				years_active: yearsActive,
			},
			available_years: availableYears,
			all_time: allTimeStats,
			years,
		});
	}

	if (parts[0] === "company" && parts[1]) {
		const companyId = Number(parts[1]);
		if (Number.isNaN(companyId))
			return json(res, { error: "Invalid company ID" }, 400);
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

		if (resource === "wrapped") {
			const [company, allInvoices, allTransactions] = await Promise.all([
				client.company.get(),
				client.invoices.listAll(),
				client.bankTransactions.listAll(),
			]);

			const startDate =
				company.activity_start_date || company.registration_date;
			const now = new Date();
			const startMs = startDate ? new Date(startDate).getTime() : now.getTime();
			const yearsActive = Math.max(
				1,
				Math.floor((now.getTime() - startMs) / (365.25 * 24 * 60 * 60 * 1000)) +
					1,
			);

			const paidInvoices = allInvoices.filter((i) => i.status !== "draft");

			// Determine available years from transactions and invoices
			const yearSet = new Set<number>();
			for (const t of allTransactions) {
				const d = t.transaction_date || t.realization_date;
				if (d) yearSet.add(Number.parseInt(d.slice(0, 4), 10));
			}
			for (const i of paidInvoices) {
				if (i.emission_date)
					yearSet.add(Number.parseInt(i.emission_date.slice(0, 4), 10));
			}
			const availableYears = [...yearSet].sort((a, b) => b - a);

			// All-time stats
			const allTimeStats = computeWrappedStats(paidInvoices, allTransactions);

			// Per-year stats
			const years: Record<string, ReturnType<typeof computeWrappedStats>> = {};
			for (const year of availableYears) {
				const yearStr = String(year);
				const yearInvoices = paidInvoices.filter(
					(i) => i.emission_date && i.emission_date.startsWith(yearStr),
				);
				const yearTransactions = allTransactions.filter((t) => {
					const d = t.transaction_date || t.realization_date;
					return d && d.startsWith(yearStr);
				});
				years[yearStr] = computeWrappedStats(yearInvoices, yearTransactions);
			}

			return json(res, {
				company: {
					name: company.name,
					registration_date: startDate,
					years_active: yearsActive,
				},
				available_years: availableYears,
				all_time: allTimeStats,
				years,
			});
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

	if (url === "/wrapped" || url.startsWith("/wrapped?")) {
		return html(res, wrappedHtml);
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
