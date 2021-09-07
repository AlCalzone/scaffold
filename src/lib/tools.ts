import { bold } from "ansi-colors";
import type { AxiosRequestConfig } from "axios";
import { Linter } from "eslint";
import * as fs from "fs-extra";
import * as JSON5 from "json5";
import * as os from "os";
import * as path from "path";
import * as prettier from "prettier";
import { URL } from "url";
import { licenses } from "./core/licenses";
import type { Answers } from "./core/questions";

export function error(message: string): void {
	console.error(bold.red(message));
	console.error();
}

export const isWindows = /^win/.test(os.platform());

/**
 * Recursively enumerates all files in the given directory
 * @param dir The directory to scan
 * @param predicate An optional predicate to apply to every found file system entry
 * @returns A list of all files found
 */
export function enumFilesRecursiveSync(
	dir: string,
	predicate?: (name: string, parentDir: string) => boolean,
): string[] {
	const ret = [];
	if (typeof predicate !== "function") predicate = () => true;
	// enumerate all files in this directory
	const filesOrDirs = fs
		.readdirSync(dir)
		.filter((f) => predicate!(f, dir)) // exclude all files starting with "."
		.map((f) => path.join(dir, f)); // and prepend the full path
	for (const entry of filesOrDirs) {
		if (fs.statSync(entry).isDirectory()) {
			// Continue recursing this directory and remember the files there
			ret.push(...enumFilesRecursiveSync(entry, predicate));
		} else {
			// remember this file
			ret.push(entry);
		}
	}
	return ret;
}

/**
 * Recursively copies all files from the source to the target directory
 * @param sourceDir The directory to scan
 * @param targetDir The directory to copy to
 * @param predicate An optional predicate to apply to every found file system entry
 */
export function copyFilesRecursiveSync(
	sourceDir: string,
	targetDir: string,
	predicate?: (name: string) => boolean,
): void {
	// Enumerate all files in this module that are supposed to be in the root directory
	const filesToCopy = enumFilesRecursiveSync(sourceDir, predicate);
	// Copy all of them to the corresponding target dir
	for (const file of filesToCopy) {
		// Find out where it's supposed to be
		const targetFileName = path.join(
			targetDir,
			path.relative(sourceDir, file),
		);
		// Ensure the directory exists
		fs.ensureDirSync(path.dirname(targetFileName));
		// And copy the file
		fs.copySync(file, targetFileName);
	}
}

/**
 * Adds https proxy options to an axios request if they were defined as an env variable
 * @param options The options object passed to axios
 */
export function applyHttpsProxy(
	options: AxiosRequestConfig,
): AxiosRequestConfig {
	const proxy: string | undefined =
		process.env.https_proxy || process.env.HTTPS_PROXY;
	if (proxy) {
		try {
			const proxyUrl = new URL(proxy);
			if (proxyUrl.hostname) {
				options.proxy = {
					host: proxyUrl.hostname,
					port: proxyUrl.port ? parseInt(proxyUrl.port, 10) : 443,
				};
			}
		} catch {
			// Invalid URL, don't use proxy
		}
	}
	return options;
}

export function formatLicense(licenseText: string, answers: Answers): string {
	return licenseText
		.replace(/\[(year|yyyy)\]/g, new Date().getFullYear().toString())
		.replace(/\[(fullname|name of copyright owner)\]/g, answers.authorName)
		.replace(/\[email\]/g, answers.authorEmail);
}

export function getFormattedLicense(answers: Answers): string {
	if (answers.license) {
		const license = licenses[answers.license];
		if (license) {
			return formatLicense(license.text, answers);
		}
	}

	return "TODO: enter license text here";
}

/** Replaces 4-space indentation with tabs */
export function indentWithTabs(text: string): string {
	if (!text) return text;
	return text.replace(/^( {4})+/gm, (match) => "\t".repeat(match.length / 4));
}

/** Replaces tab indentation with 4 spaces */
export function indentWithSpaces(text: string): string {
	if (!text) return text;
	return text.replace(/^(\t)+/gm, (match) => " ".repeat(match.length * 4));
}

/** Normalizes formatting of a JSON string */
export function formatJsonString(
	json: string,
	indentation: "Tab" | "Space (4)",
): string {
	return JSON.stringify(
		JSON5.parse(json),
		null,
		indentation === "Tab" ? "\t" : 4,
	);
}

export enum Quotemark {
	"single" = "'",
	"double" = '"',
}

function createESLintOptions(
	language: "TypeScript", //Exclude<Answers["language"], undefined>,
	quotes: keyof typeof Quotemark,
): Record<string, any> {
	const baseOptions: Record<string, any> = {
		env: {
			es6: true,
			node: true,
			mocha: true,
		},
		parserOptions: {
			ecmaVersion: 2018,
			ecmaFeatures: {
				jsx: true,
			},
		},
		rules: {
			quotes: [
				"error",
				quotes,
				{
					avoidEscape: true,
					allowTemplateLiterals: true,
				},
			],
		},
	};
	if (language === "TypeScript") {
		baseOptions.parser = "@typescript-eslint/parser";
		baseOptions.parserOptions = {
			...baseOptions.parserOptions,
			sourceType: "module",
		};
	}
	return baseOptions;
}

// /** Formats a JS source file to use single quotes */
// export function jsFixQuotes(
// 	sourceText: string,
// 	quotes: keyof typeof Quotemark,
// ): string {
// 	const linter = new Linter();
// 	const result = linter.verifyAndFix(
// 		sourceText,
// 		createESLintOptions("JavaScript", quotes),
// 	);
// 	return result.output;
// }

/** Formats a TS source file to use single quotes */
export function tsFixQuotes(
	sourceText: string,
	quotes: keyof typeof Quotemark,
): string {
	const linter = new Linter();
	linter.defineParser(
		"@typescript-eslint/parser",
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		require("@typescript-eslint/parser"),
	);
	const result = linter.verifyAndFix(
		sourceText,
		createESLintOptions("TypeScript", quotes),
	);
	return result.output;
}

export function formatWithPrettier(
	sourceText: string,
	answers: Pick<Answers, "quotes" | "indentation">,
	extension: "js" | "ts" | "json",
): string {
	// Keep this in sync with templates/_prettierrc.js.ts
	const prettierOptions: prettier.Options = {
		semi: true,
		trailingComma: "all",
		singleQuote: answers.quotes === "single",
		printWidth: 120,
		useTabs: answers.indentation === "Tab",
		tabWidth: 4,
		endOfLine: "lf",
		// To infer the correct parser
		filepath: `index.${extension}`,
	};
	return prettier.format(sourceText, prettierOptions);
}

export function getOwnVersion(): string {
	for (const jsonPath of ["../../package.json", "../../../package.json"]) {
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			return require(jsonPath).version;
		} catch (e) {
			/* OK */
		}
	}
	/* istanbul ignore next */
	return "unknown";
}

export function capitalize(name: string): string {
	return name[0].toUpperCase() + name.slice(1);
}

export function kebabCaseToUpperCamelCase(name: string): string {
	return name
		.split(/[_\-]/)
		.filter((part) => part.length > 0)
		.map(capitalize)
		.join("");
}

export function getRequestTimeout(): number {
	let ret: number | undefined;
	if (process.env.REQUEST_TIMEOUT) {
		ret = parseInt(process.env.REQUEST_TIMEOUT, 10);
	}
	if (ret == undefined || Number.isNaN(ret)) return 5000;
	return ret;
}
