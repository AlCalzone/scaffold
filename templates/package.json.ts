import * as JSON5 from "json5";
import pLimit from "p-limit";
import { licenses } from "../src/lib/core/licenses";
import { getDefaultAnswer } from "../src/lib/core/questions";
import { fetchPackageReferenceVersion, getPackageName } from "../src/lib/packageVersions";
import type { TemplateFunction } from "../src/lib/scaffold";

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

	const useESLint = !!answers.tools?.includes("ESLint");
	const usePrettier = !!answers.tools?.includes("Prettier");
	const useCommitlint = !!answers.tools?.includes("Commitlint");
	const useReleaseScript = answers.releaseScript;
	const useJest = answers.testing === "jest";
	const useMocha = answers.testing === "mocha";

	const isMonorepo = answers.monorepo;

	const dependencyTasks: string[] = [];
	const dependencies = await getDependencyEntries(dependencyTasks)

	const devDependencyTasks: string[] = [
		`@tsconfig/node${answers.nodeVersion}`,
		`@types/node@${answers.nodeVersion}`,
		"typescript@~4.4",
		"rimraf",
		"source-map-support",
		"ts-node",
		...(useESLint
			? [
				"@typescript-eslint/eslint-plugin",
				"@typescript-eslint/parser",
				"eslint",
			]
			: []),
		...(usePrettier
			? ["eslint-config-prettier", "eslint-plugin-prettier", "prettier"]
			: []),
		...(useCommitlint ? [
				"@commitlint/cli",
				"@commitlint/config-conventional",
				"commitizen",
				"husky@7"
		] : []),
		...(useReleaseScript ? ["@alcalzone/release-script@^2"] : []),
		...(useJest ? [
			"@babel/cli",
			"@babel/core",
			"@babel/preset-env",
			"@babel/preset-typescript",
			"@types/jest",
			"jest",
			"jest-extended",
		] : []),
		...(useMocha ? [
			"@types/chai",
			"@types/chai-as-promised",
			"@types/mocha",
			"@types/sinon",
			"@types/sinon-chai",
			"chai",
			"chai-as-promised",
			"mocha",
			"sinon",
			"sinon-chai",			
		] : []),
		...(isMonorepo ? ["lerna"] : []),
	];
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

	const getRunScriptCmd = (scriptName: string, runArgs?: string): string => {
		return `${answers.packageManager === "yarn" ? "yarn" : "npm run"
			} ${scriptName}${answers.packageManager === "npm" && !!runArgs ? " --" : ""}${!!runArgs ? ` ${runArgs}` : ""
			}`;
	};
	
	const template = `
{
	"name": "${isMonorepo ? "@" : ""}${answers.projectName.toLowerCase()}${isMonorepo ? "/repo" : ""}",
	"version": "0.0.1",
	"description": "${answers.description || answers.projectName}",
	"keywords": ${JSON.stringify(answers.keywords || getDefaultAnswer("keywords"))},
	"license": "${licenses[answers.license!].id}",
	"author": {
		"name": "${answers.authorName}",
		"email": "${answers.authorEmail}",
	},
	${isMonorepo ? (`
		"private": true,
		"workspaces": [
			"packages/*"
		],	
	`) : (`
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
	`)}
	"dependencies": {${dependencies.join(",")}},
	"devDependencies": {${devDependencies.join(",")}},
	"scripts": {
		${isMonorepo ? (`
			"build": "lerna run build",
			"watch": "lerna run watch",
		`) : (`
			"prebuild": "rimraf ./build",
			"build": "tsc -p tsconfig.build.json",
			"watch": "tsc -p tsconfig.build.json --watch",
		`)}
		${useJest ? (`
			"test:reset": "jest --clear-cache",
			"test:ts": "jest",
			"test:ci": "${getRunScriptCmd("test:ts", "--runInBand")}",
			"test": "${getRunScriptCmd("test:ts", "--watch")}",
			"coverage:ci": "${getRunScriptCmd("test:ci", "--collect-coverage")}",
			"coverage": "${getRunScriptCmd("test:ts", "--collect-coverage")}",
		`) : useMocha ? (`
			"test:ts": "mocha \\"${isMonorepo ? "packages/*/" : ""}src/**/*.test.ts\\"",
			"test:ci": "${getRunScriptCmd("test:ts")}",
			"test": "${getRunScriptCmd("test:ts", "--watch")}",
		`) : (`
			"test": "echo \\"No tests defined!\\" && exit 1",
		`)}
		${useESLint ? (`
			"lint": "eslint --ext .ts ${isMonorepo ? `\\"packages/*/src/**/*.ts\\"` : "src/"}",
		`) : ""}
		${useReleaseScript ? (
			isMonorepo
				? (`
					"release": "lerna version",
					"preversion": "release-script --lerna-check",
					"version": "release-script --lerna",
					"postversion": "git push && git push --tags",
				`) : (`
					"release": "release-script",
				`)
		) : ""}
		${useCommitlint ? (`
			"commit": "git-cz",
			"postinstall": "husky install",
		`) : ""}
	},
	"homepage": "https://github.com/${answers.authorGithub}/${answers.projectName}",
	"repository": {
		"type": "git",
		"url": "${gitUrl}",
	},
	"bugs": {
		"url": "https://github.com/${answers.authorGithub}/${answers.projectName}/issues",
	},
	"readmeFilename": "README.md",
	${useCommitlint ? (`
		"config": {
			"commitizen": {
				"path": "./node_modules/cz-conventional-changelog"
			}
		}
	`) : ""}
}`;

	return JSON.stringify(JSON5.parse(template), null, 2);
};

// package.json is always formatted with 2 spaces
templateFunction.noReformat = true;
export = templateFunction;
