import type { TemplateFunction } from "../src/lib/projectGen";

const templateFunction: TemplateFunction = answers => {

	const usePrettier = answers.tools && answers.tools.indexOf("Prettier") > -1;
	if (!usePrettier) return;
	const useTypeScript = true; //answers.language === "TypeScript";

	const template = `
.github/actions/**/*.yml
.github/workflows/
CHANGELOG*.md
package.json
package-lock.json
${useTypeScript ? "build/" : ""}
`;
	return template.trim();
};

templateFunction.customPath = ".prettierignore";
export = templateFunction;
