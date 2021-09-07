import type { Answers } from "./questions";

const emailRegex =
	/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export type CheckResult = true | string;
export async function checkMinSelections(
	category: string,
	min: number,
	answers: any[],
): Promise<CheckResult> {
	if (answers.length >= min) return true;
	return `Please enter at least ${min} ${category}`;
}

function isAdapterNameValid(name: string): CheckResult {
	if (!isNotEmpty(name)) {
		return "Please enter a valid name!";
	}
	const forbiddenChars = /[^a-z0-9\-_]/g;
	if (forbiddenChars.test(name)) {
		return `The name may only consist of lowercase letters, numbers, "-" and "_"!`;
	}
	if (!/^[a-z]/.test(name)) {
		return `The name must start with a letter!`;
	}
	if (!/[a-z0-9]$/.test(name)) {
		return `The name must end with a letter or number!`;
	}
	return true;
}

export function checkAdapterName(name: string): CheckResult {
	const validCheck = isAdapterNameValid(name);
	if (typeof validCheck === "string") return validCheck;
	return true;
}

function isNotEmpty(answer?: string): answer is string {
	return answer != undefined && answer.length > 0 && answer.trim().length > 0;
}

export async function checkAuthorName(name?: string): Promise<CheckResult> {
	if (!isNotEmpty(name)) {
		return "Please enter a valid name!";
	}
	return true;
}

export async function checkEmail(email: string): Promise<CheckResult> {
	if (!emailRegex.test(email)) {
		return "Please enter a valid email address!";
	}
	return true;
}

export async function checkTypeScriptTools(
	tools: Exclude<Answers["tools"], undefined>,
): Promise<CheckResult> {
	if (tools.indexOf("Prettier") > -1 && tools.indexOf("ESLint") === -1) {
		return "ESLint must be selected to use Prettier!";
	}
	return true;
}

export function transformDescription(description: string): string | undefined {
	description = description.trim();
	if (description.length === 0) return undefined;
	return description;
}

export function transformKeywords(keywords: string): string[] | undefined {
	const keywordsArray = keywords
		.trim()
		.split(",")
		.map((k) => k.trim())
		.filter((k) => !!k);
	if (keywordsArray.length === 0) return undefined;
	return keywordsArray;
}

export function transformContributors(
	contributors: string,
): string[] | undefined {
	const contributorsArray = contributors
		.trim()
		.split(",")
		.map((c) => c.trim())
		.filter((c) => !!c);
	if (contributorsArray.length === 0) return undefined;
	return contributorsArray;
}
