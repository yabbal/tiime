import Table from "cli-table3";
import { consola } from "consola";

export type OutputFormat = "json" | "table" | "csv";

export const formatArg = {
	format: {
		type: "string" as const,
		description: "Format de sortie (json, table, csv)",
		default: "json",
	},
};

interface OutputOptions {
	format?: OutputFormat;
}

const stringifyValue = (value: unknown): string => {
	if (value === null || value === undefined) return "";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
};

const outputJson = (data: unknown): void => {
	process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
};

const outputTable = (data: unknown): void => {
	if (
		Array.isArray(data) &&
		data.length > 0 &&
		typeof data[0] === "object" &&
		data[0] !== null
	) {
		const keys = Object.keys(data[0] as Record<string, unknown>);
		const table = new Table({ head: keys });
		for (const row of data) {
			const record = row as Record<string, unknown>;
			table.push(keys.map((key) => stringifyValue(record[key])));
		}
		process.stdout.write(`${table.toString()}\n`);
	} else if (
		typeof data === "object" &&
		data !== null &&
		!Array.isArray(data)
	) {
		const table = new Table();
		for (const [key, value] of Object.entries(
			data as Record<string, unknown>,
		)) {
			table.push({ [key]: stringifyValue(value) });
		}
		process.stdout.write(`${table.toString()}\n`);
	} else {
		outputJson(data);
	}
};

const escapeCsvField = (value: string): string => {
	if (value.includes(",") || value.includes('"') || value.includes("\n")) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
};

const outputCsv = (data: unknown): void => {
	if (
		Array.isArray(data) &&
		data.length > 0 &&
		typeof data[0] === "object" &&
		data[0] !== null
	) {
		const keys = Object.keys(data[0] as Record<string, unknown>);
		const header = keys.map(escapeCsvField).join(",");
		const lines = data.map((row) => {
			const record = row as Record<string, unknown>;
			return keys
				.map((key) => escapeCsvField(stringifyValue(record[key])))
				.join(",");
		});
		process.stdout.write(`${header}\n${lines.join("\n")}\n`);
	} else if (
		typeof data === "object" &&
		data !== null &&
		!Array.isArray(data)
	) {
		const entries = Object.entries(data as Record<string, unknown>);
		const header = "key,value";
		const lines = entries.map(
			([key, value]) =>
				`${escapeCsvField(key)},${escapeCsvField(stringifyValue(value))}`,
		);
		process.stdout.write(`${header}\n${lines.join("\n")}\n`);
	} else {
		outputJson(data);
	}
};

export const output = (data: unknown, options?: OutputOptions): void => {
	const format = options?.format ?? "json";

	switch (format) {
		case "table":
			outputTable(data);
			break;
		case "csv":
			outputCsv(data);
			break;
		default:
			outputJson(data);
			break;
	}
};

export const outputSummary = (text: string): void => {
	consola.info(text);
};

export const outputError = (error: unknown): void => {
	const message = error instanceof Error ? error.message : String(error);
	process.stderr.write(`${JSON.stringify({ error: message })}\n`);
	process.exit(1);
};
