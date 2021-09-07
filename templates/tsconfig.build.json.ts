import { readFile, TemplateFunction } from "../src/lib/projectGen";

export = (_answers => {

	const useTypeScript = true; //answers.language === "TypeScript";
	if (!useTypeScript) return;

	return readFile("tsconfig.build.raw.json", __dirname);
}) as TemplateFunction;
