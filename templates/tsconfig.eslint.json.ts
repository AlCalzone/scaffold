import { readFile, TemplateFunction } from "../src/lib/scaffold";

export = (answers => {

	const useTypeScript = true; //answers.language === "TypeScript";
	if (!useTypeScript) return;

	// This is for a monorepo setup with ESLint
	if (!answers.monorepo || !answers.tools.includes("ESLint")) return;

	return readFile("tsconfig.eslint.raw.json", __dirname);
}) as TemplateFunction;
