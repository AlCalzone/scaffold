import type { TemplateFunction } from "../../../src/lib/scaffold";

const templateFunction: TemplateFunction = answers => {

	const useTypeScript = true; //answers.language === "TypeScript";
	if (!useTypeScript || !answers.monorepo) return;

	const template = `
// tsconfig for building - only applies to the src directory
{
	"extends": "./tsconfig.json",
	"compilerOptions": {
		"rootDir": "src",
		"outDir": "build"
	},
	"references": [
		// Add references to other projects here
		// {
		// 	"path": "../other-project-name/tsconfig.build.json"
		// },
	],
	"include": ["src/**/*.ts"],
	"exclude": ["src/**/*.test.ts"]
}`;
	return template.trim();
};
templateFunction.customPath = answers => `packages/${answers.monorepoPackageName!}/tsconfig.build.json`;

export = templateFunction;
