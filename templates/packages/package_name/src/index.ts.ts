import type { TemplateFunction } from "../../../../src/lib/scaffold";

const templateFunction: TemplateFunction = answers => {

	if (!answers.monorepo) return;

	const template = `
console.log("Hello World!");
`;
	return template.trim();
};
templateFunction.customPath = answers => `packages/${answers.monorepoPackageName!}/src/index.ts`;

export = templateFunction;
