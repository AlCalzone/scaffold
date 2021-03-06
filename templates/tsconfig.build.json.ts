import { readFile, TemplateFunction } from "../src/lib/scaffold";

export = (answers => {

	const useTypeScript = true; //answers.language === "TypeScript";
	if (!useTypeScript) return;

	// This is not necessary in a monorepo setup
	if (answers.monorepo) return;

	return readFile("tsconfig.build.raw.json", __dirname);
}) as TemplateFunction;
