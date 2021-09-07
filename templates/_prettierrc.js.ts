import type { TemplateFunction } from "../src/lib/scaffold";

const templateFunction: TemplateFunction = answers => {

	const usePrettier = answers.tools && answers.tools.indexOf("Prettier") > -1;
	if (!usePrettier) return;

	// Keep this in sync with lib/tools.ts -> formatWithPrettier()
	const template = `
module.exports = {
	semi: true,
	trailingComma: "all",
	singleQuote: ${answers.quotes === "single"},
	printWidth: 120,
	useTabs: ${answers.indentation === "Tab"},
	tabWidth: 4,
	endOfLine: "lf",
};
`;
	return template.trim();
};

templateFunction.customPath = ".prettierrc.js";
export = templateFunction;
