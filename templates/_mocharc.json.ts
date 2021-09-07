import type { TemplateFunction } from "../src/lib/scaffold";

const templateFunction: TemplateFunction = answers => {

	if (answers.testing !== "mocha") return;
	const isMonorepo = answers.monorepo;

	const template = `
{
	"require": [
		"./test/mocha.setup.js",
		"ts-node/register",
		"source-map-support/register"
	],
	"watch-files": ["${isMonorepo ? "packages/*/" : ""}src/**/*.test.ts"]
}
`;
	return template.trim();
};

templateFunction.customPath = ".mocharc.json";
export = templateFunction;
