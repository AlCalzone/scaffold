import type { TemplateFunction } from "../src/lib/scaffold";

const templateFunction: TemplateFunction = answers => {

	const useESLint = answers.tools?.includes("ESLint")
	if (!useESLint) return;

	const useTypeScript = true; //answers.language === "TypeScript";
	const usePrettier = answers.tools?.includes("Prettier");

	const template = `
${useTypeScript ? "build/" : ""}
${usePrettier ? ".prettierrc.js" : ""}
**/.eslintrc.js
`;
	return template.trim().replace(/\n+/g, "\n");
};

templateFunction.customPath = ".eslintignore";
export = templateFunction;
