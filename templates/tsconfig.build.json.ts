import { readFile, TemplateFunction } from "../src/lib/projectGen";

export = (answers => {

	const useTypeScript = answers.language === "TypeScript";
	if (!useTypeScript) return;

	return readFile("tsconfig.build.raw.json", __dirname);
}) as TemplateFunction;
