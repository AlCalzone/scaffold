import type { TemplateFunction } from "../../src/lib/scaffold";

const templateFunction: TemplateFunction = answers => {

	if (!answers.tools.includes("Commitlint")) return;

	const template = `
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

${answers.packageManager === "yarn" ? (
	`yarn run commitlint --edit "$1"`
) : (
	`npx --no-install commitlint --edit "$1"`
)}
`;
	return template.trim();
};

templateFunction.customPath = ".husky/commit-msg";
export = templateFunction;
