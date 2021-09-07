import type { TemplateFunction } from "../src/lib/scaffold";

export = (answers => {

	const useTypeScript = true; //answers.language === "TypeScript";
	if (!useTypeScript) return;

	const isMonorepo = answers.monorepo;

	const template = `
// Root tsconfig to set the settings and power editor support for all TS files
{
	// To update the compilation target, install a different version of @tsconfig/node... and reference it here
	// https://github.com/tsconfig/bases#node-${answers.nodeVersion}-tsconfigjson
	"extends": "@tsconfig/node${answers.nodeVersion}/tsconfig.json",
	"compilerOptions": {
		${isMonorepo ? (
`		// Required for monorepos
		"composite": true,
		"declaration": true,
		"declarationMap": true,`) : (
`		// do not compile anything, this file is just to configure type checking
		// the compilation is configured in tsconfig.build.json
		"noEmit": true,`)}

		// Never emit faulty JS
		"noEmitOnError": true,

		"outDir": "build/",
		"removeComments": false,

		// Avoid runtime imports that are unnecessary
		"importsNotUsedAsValues": "error",

		// Required for TS debugging
		"sourceMap": true,
		"inlineSourceMap": false,
	},
	"include": [
		${isMonorepo ? (`
			"packages/**/src/**/*.ts",
			"test/**/*.ts"
		`) : (`
			"**/*.ts",
		`)}
	],
	"exclude": [
		${isMonorepo ? (`
			"**/build/**",
			"node_modules/**",
			"packages/**/node_modules"
		`) : (`
			"build/**",
			"node_modules/**"
		`)}
	]
}`;
	return template.trim();
}) as TemplateFunction;
