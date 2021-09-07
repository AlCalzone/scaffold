import * as JSON5 from "json5";
import pLimit from "p-limit";
import { licenses } from "../../../src/lib/core/licenses";
import { getDefaultAnswer } from "../../../src/lib/core/questions";
import { fetchPackageReferenceVersion, getPackageName } from "../../../src/lib/packageVersions";
import type { TemplateFunction } from "../../../src/lib/scaffold";

// Limit package version downloads to 10 simultaneous connections
const downloadLimiter = pLimit(10);

function getDependencyEntries(dependencyTasks: string[]): Promise<string[]> {
	const dependencyPromises = dependencyTasks
		.sort()
		.map((dep) => (async () => `"${getPackageName(dep)}": "${await fetchPackageReferenceVersion(dep)}"`))
		.map(task => downloadLimiter(task))
		;
	return Promise.all(dependencyPromises);
}

const templateFunction: TemplateFunction = async answers => {

	const useTypeScript = true; //answers.language === "TypeScript";
	if (!answers.monorepo) return;

	const packageName = answers.monorepoPackageName!;

	const dependencyTasks: string[] = [];
	const dependencies = await getDependencyEntries(dependencyTasks)

	const devDependencyTasks: string[] = [];
	const devDependencies = await getDependencyEntries(devDependencyTasks);
	
	const engines = {
		12: ">=12.20",
		14: ">=14",
		16: ">=16",
	} as const;

	const gitUrl =
		answers.gitRemoteProtocol === "HTTPS"
			? `https://github.com/${answers.authorGithub}/${answers.projectName}`
			: `git@github.com:${answers.authorGithub}/${answers.projectName}.git`;
	
	// Generate whitelist for package files
	const packageFiles = [
		"LICENSE",
		...(useTypeScript ? ["build/"] : [])
	].sort(
		(a, b) => {
			// Put directories on top
			const isDirA = a.includes("/");
			const isDirB = b.includes("/");
			if (isDirA && !isDirB) return -1;
			if (isDirB && !isDirA) return 1;
			return a.localeCompare(b);
		}
	);

	// const getRunScriptCmd = (scriptName: string, runArgs?: string): string => {
	// 	return `${answers.packageManager === "yarn" ? "yarn" : "npm run"
	// 		} ${scriptName}${answers.packageManager === "npm" && !!runArgs ? " --" : ""}${!!runArgs ? ` ${runArgs}` : ""
	// 		}`;
	// };
	
	const template = `
{
	"name": "@${answers.projectName.toLowerCase()}/${packageName}",
	"publishConfig": {
		"access": "public"
	},
	"version": "0.0.1",
	"description": "${answers.description || answers.projectName}",
	"keywords": ${JSON.stringify(answers.keywords || getDefaultAnswer("keywords"))},
	"license": "${licenses[answers.license!].id}",
	"author": {
		"name": "${answers.authorName}",
		"email": "${answers.authorEmail}",
	},
	"main": "build/index.js",
	"exports": {
		".": "./build/index.js",
		"./package.json": "./package.json",
		"./*.map": "./build/*.js.map",
		"./*": "./build/*.js"
	},
	"types": "build/index.d.ts",
	"typesVersions": {
		"*": {
			"build/index.d.ts": ["build/index.d.ts"],
			"*": ["build/*"]
		}
	},
	"files": ${JSON.stringify(packageFiles)},
	"engines": {
		"node": "${engines[answers.nodeVersion]}"
	},
	"dependencies": {${dependencies.join(",")}},
	"devDependencies": {${devDependencies.join(",")}},
	"scripts": {
		"clean": "tsc -b tsconfig.build.json --clean",
		"prebuild": "rimraf ./build",
		"build": "tsc -p tsconfig.build.json",
		"watch": "tsc -p tsconfig.build.json --watch",
	},
	"homepage": "https://github.com/${answers.authorGithub}/${answers.projectName}",
	"repository": {
		"type": "git",
		"url": "${gitUrl}",
	},
	"bugs": {
		"url": "https://github.com/${answers.authorGithub}/${answers.projectName}/issues",
	},
	"readmeFilename": "README.md"
}`;

	return JSON.stringify(JSON5.parse(template), null, 2);
};
templateFunction.customPath = answers => `packages/${answers.monorepoPackageName!}/package.json`;

// package.json is always formatted with 2 spaces
templateFunction.noReformat = true;
export = templateFunction;
