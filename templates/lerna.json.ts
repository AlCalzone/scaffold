import type { TemplateFunction } from "../src/lib/scaffold";

const templateFunction: TemplateFunction = answers => {

	if (!answers.monorepo) return;

	const template = `
{
	"packages": [
		"packages/*"
	],
	"useWorkspaces": true,
	"npmClient": "${answers.packageManager}",
	"version": "0.0.1",
	"command": {
		"run": {
			"stream": true
		},
		"version": {
			"allowBranch": [
				"master",
				"release-*",
				"next"
			],
			"ignoreChanges": [
				"*.md"
			],
			"exact": true,
			"amend": ${answers.releaseScript},
			"push": ${!answers.releaseScript}
		}
	}
}
`;
	return template.trim();
};

export = templateFunction;
