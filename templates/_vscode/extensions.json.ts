import * as JSON5 from "json5";
import type { TemplateFunction } from "../../src/lib/projectGen";

const templateFunction: TemplateFunction = answers => {

	const useESLint = !!answers.tools?.includes("ESLint");
	const usePrettier = !!answers.tools?.includes("Prettier");

	const recommendations = [
		...(useESLint ? ["dbaeumer.vscode-eslint"] : []),
		...(usePrettier ? ["esbenp.prettier-vscode"] : []),
	];


	if (!recommendations.length) return;

	const template = `
{
	"recommendations": ${JSON.stringify(recommendations)}
}
`;
return JSON.stringify(JSON5.parse(template), null, 4);
};

templateFunction.customPath = ".vscode/extensions.json";
export = templateFunction;
