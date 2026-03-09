// Generate a unified coverage comment for PRs
// Usage: node coverage-comment.js <sdk-summary> <cli-summary>

const fs = require("node:fs");

const sdkPath = process.argv[2];
const cliPath = process.argv[3];

const sdk = JSON.parse(fs.readFileSync(sdkPath, "utf8")).total;
const cli = JSON.parse(fs.readFileSync(cliPath, "utf8")).total;

const icon = (pct) => {
	if (pct >= 80) return "🟢";
	if (pct >= 60) return "🟡";
	if (pct >= 40) return "🟠";
	return "🔴";
};

const bar = (pct) => {
	const filled = Math.round(pct / 5);
	const empty = 20 - filled;
	return `\`${"█".repeat(filled)}${"░".repeat(empty)}\``;
};

const avg = (...vals) =>
	Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);

const formatRow = (label, data) =>
	`| ${icon(data.pct)} | ${label} | ${bar(data.pct)} | **${data.pct}%** | ${data.covered}/${data.total} |`;

const formatPackage = (name, data) => `### ${name}

| | Category | Coverage | % | Covered |
|---|---|---|---:|---:|
${formatRow("Statements", data.statements)}
${formatRow("Branches", data.branches)}
${formatRow("Functions", data.functions)}
${formatRow("Lines", data.lines)}`;

const totalPct = avg(sdk.statements.pct, cli.statements.pct);

const comment = `## ${icon(totalPct)} Coverage Report — **${totalPct}%**

${formatPackage("📦 tiime-sdk", sdk)}

${formatPackage("⌨️ tiime-cli", cli)}

---

<details>
<summary>Legend</summary>

| Icon | Range |
|------|-------|
| 🟢 | ≥ 80% |
| 🟡 | ≥ 60% |
| 🟠 | ≥ 40% |
| 🔴 | < 40% |

</details>

<!-- coverage-report-comment -->`;

console.log(comment);
