import type { TemplateFunction } from "../src/lib/scaffold";

const templateFunction: TemplateFunction = answers => {

	if (answers.testing !== "jest") return;

	const template = `
{
	"presets": [
		"@babel/preset-typescript",
		["@babel/preset-env", { "targets": { "node": "current" } }]
	],
	"plugins": [
		["@babel/plugin-transform-typescript", { "allowDeclareFields": true }]
	]
}
`;
	return template.trim();
};

templateFunction.customPath = ".babelrc";
export = templateFunction;
