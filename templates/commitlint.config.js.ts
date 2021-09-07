import type { TemplateFunction } from "../src/lib/scaffold";

const templateFunction: TemplateFunction = answers => {

	if (!answers.tools.includes("Commitlint")) return;

	const template = `
module.exports = {
	extends: ["@commitlint/config-conventional"],
};
`;
	return template.trim();
};

export = templateFunction;
