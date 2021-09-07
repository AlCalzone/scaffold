import * as JSON5 from "json5";
import type { TemplateFunction } from "../../src/lib/projectGen";

const templateFunction: TemplateFunction = answers => {

	const useESLint = !!answers.tools?.includes("ESLint");
	const usePrettier = !!answers.tools?.includes("Prettier");
	const useTypeScript = true; //answers.language === "TypeScript";

	if (!useESLint && !usePrettier && !useTypeScript) return;

	const template = `
{
${useTypeScript ? `"typescript.tsdk": "node_modules/typescript/lib",` : ""}
${useESLint ? `"eslint.enable": true,` : ""}
${usePrettier ? (`
	"editor.formatOnSave": true,
	"editor.defaultFormatter": "esbenp.prettier-vscode",
	${useTypeScript ? (`
	"[typescript]": {
		"editor.codeActionsOnSave": {
			"source.organizeImports": true
		},
	},
	`) : ""}
`) : ""}
}
`;
return JSON.stringify(JSON5.parse(template), null, 4);
};

templateFunction.customPath = ".vscode/settings.json";
export = templateFunction;
