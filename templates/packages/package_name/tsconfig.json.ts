import type { TemplateFunction } from "../../../src/lib/scaffold";

const templateFunction: TemplateFunction = answers => {

	const useTypeScript = true; //answers.language === "TypeScript";
	if (!useTypeScript || !answers.monorepo) return;

	const template = `
// tsconfig for IntelliSense - active in all files in the current package
{
	"extends": "../../tsconfig.json",
	"compilerOptions": {},
	"references": [
		// Add references to other projects here
		// {
		// 	"path": "../other-project-name/tsconfig.build.json"
		// },
	],
	"include": ["src/**/*.ts"],
	"exclude": ["build/**", "node_modules/**"]
}`;
	return template.trim();
};
templateFunction.customPath = answers => `packages/${answers.monorepoPackageName!}/tsconfig.json`;

export = templateFunction;
