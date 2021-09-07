import { isArray } from "alcalzone-shared/typeguards";
import { dim, gray, green } from "ansi-colors";
import type { SpecificPromptOptions } from "enquirer";
import {
	checkAuthorName,
	checkEmail,
	checkProjectName,
	CheckResult,
	checkTypeScriptTools,
	makeBool,
	transformDescription,
	transformKeywords,
} from "./actionsAndTransformers";

// This is being used to simulate wrong options for conditions on the type level
const __misused: unique symbol = Symbol.for("__misused");

type QuestionAction<T> = (value: T) => CheckResult | Promise<CheckResult>;
export type AnswerValue = string | boolean | number;
export type Condition = { name: string } & (
	| { value: AnswerValue | AnswerValue[] }
	| { contains: AnswerValue }
	| { doesNotContain: AnswerValue }
	| { [__misused]: undefined }
);

export function testCondition(
	condition: Condition | Condition[] | undefined,
	answers: Record<string, any>,
): boolean {
	if (condition == undefined) return true;

	function testSingleCondition(cond: Condition): boolean {
		if ("value" in cond) {
			return answers[cond.name] === cond.value;
		} else if ("contains" in cond) {
			return (
				answers[cond.name] &&
				(answers[cond.name] as AnswerValue[]).indexOf(cond.contains) >
					-1
			);
		} else if ("doesNotContain" in cond) {
			return (
				!answers[cond.name] ||
				(answers[cond.name] as AnswerValue[]).indexOf(
					cond.doesNotContain,
				) === -1
			);
		}
		return false;
	}

	if (isArray(condition)) {
		return condition.every((cond) => testSingleCondition(cond));
	} else {
		return testSingleCondition(condition);
	}
}

export type TransformResult = (
	val: AnswerValue | AnswerValue[],
) =>
	| AnswerValue
	| AnswerValue[]
	| undefined
	| Promise<AnswerValue | AnswerValue[] | undefined>;

export interface QuestionMeta {
	label: string;
	/** One or more conditions that need(s) to be fulfilled for this question to be asked */
	condition?: Condition | Condition[];
	resultTransform?: TransformResult;
	action?: QuestionAction<undefined | AnswerValue | AnswerValue[]>;
	/** Whether an answer for this question is optional */
	optional?: boolean;
	// /**
	//  * Whether this question should only be asked in expert mode.
	//  * In non-expert mode, the initial answer will be used.
	//  */
	// expert?: true;
}

export type Question = SpecificPromptOptions &
	QuestionMeta & { name: keyof Answers };
export interface QuestionGroup {
	title: string;
	headline: string;
	questions: Question[];
}

function styledMultiselect<
	T extends Pick<Question, Exclude<keyof Question, "type">> & {
		choices: any[];
	},
>(ms: T): T & { type: "multiselect" } {
	return Object.assign({} as Question, ms, {
		type: "multiselect" as const,
		hint: gray("(<space> to select, <return> to submit)"),
		symbols: {
			indicator: {
				on: green("■"),
				off: dim.gray("□"),
			},
		},
	});
}

/** All questions and the corresponding text lines */
export const questionGroups: QuestionGroup[] = [
	{
		title: "Basics",
		headline: "Let's get started with a few questions about your project!",
		questions: [
			{
				type: "input",
				name: "projectName",
				label: "Project Name",
				message: "Please enter the name of your project:",
				action: checkProjectName,
			},
			{
				type: "input",
				name: "description",
				label: "Description",
				message: "Please enter a short description:",
				hint: "(optional)",
				optional: true,
				resultTransform: transformDescription,
			},
			{
				type: "input",
				name: "keywords",
				label: "Keywords",
				message:
					"Enter some keywords (separated by commas) to describe your project:",
				hint: "(optional)",
				optional: true,
				resultTransform: transformKeywords,
			},
		],
	},
	{
		title: "Environment",
		headline: "Let's configure the development environment...",
		questions: [
			{
				type: "select",
				name: "packageManager",
				label: "Package manager",
				message: "Which package manager would you like to use?",
				initial: "yarn",
				choices: ["yarn", "npm"],
			},
			{
				type: "select",
				name: "nodeVersion",
				label: "Node.js version",
				message: "Which version of Node.js should be targeted?",
				initial: "14",
				choices: ["12", "14", "16"],
				resultTransform: (val) => parseInt(val as string, 10),
			},
			styledMultiselect({
				name: "tools",
				label: "Tools",
				message: "Which of the following tools do you want to use?",
				initial: [0, 1],
				choices: [
					{ message: "ESLint", hint: "(recommended)" },
					{
						message: "Prettier",
						hint: "(requires ESLint, recommended)",
					},
				],
				action: checkTypeScriptTools,
			}),
			{
				type: "select",
				name: "releaseScript",
				label: "Release Script",
				message:
					"Would you like to use @alcalzone/release-script to automate releases?",
				initial: "yes",
				choices: ["yes", "no"],
				resultTransform: makeBool,
			},
			{
				type: "select",
				name: "indentation",
				label: "Indentation",
				message: "Do you prefer tab or space indentation?",
				initial: "Tab",
				choices: ["Tab", "Space (4)"],
			},
			{
				type: "select",
				name: "quotes",
				label: "Quotes",
				message: "Do you prefer double or single quotes?",
				initial: "double",
				choices: ["double", "single"],
			},
		],
	},
	{
		title: "Administrative",
		headline: "Almost done! Just a few administrative details...",
		questions: [
			{
				type: "input",
				name: "authorName",
				label: "Author Name",
				message: "Please enter your name (or nickname):",
				action: checkAuthorName,
			},
			{
				type: "input",
				name: "authorGithub",
				label: "GitHub Name",
				message: "What's your name/org on GitHub?",
				initial: ((answers: Answers) => answers.authorName) as any,
				action: checkAuthorName,
			},
			{
				type: "input",
				name: "authorEmail",
				label: "Adapter E-Mail",
				message: "What's your email address?",
				action: checkEmail,
			},
			{
				type: "select",
				name: "gitRemoteProtocol",
				label: "GIT Protocol",
				message: "Which protocol should be used for the repo URL?",
				// expert: true,
				initial: "HTTPS",
				choices: [
					{
						message: "HTTPS",
					},
					{
						message: "SSH",
						hint: "(requires you to setup SSH keys)",
					},
				],
			},
			{
				condition: { name: "cli", value: true },
				type: "select",
				name: "gitCommit",
				label: "Git Commit",
				// expert: true,
				message: "Initialize the GitHub repo automatically?",
				initial: "no",
				choices: ["yes", "no"],
				resultTransform: makeBool,
			},
			{
				type: "select",
				name: "license",
				label: "License",
				message: "Which license should be used for your project?",
				initial: 5,
				choices: [
					// TODO: automate (GH#1)
					"GNU AGPLv3",
					"GNU GPLv3",
					"GNU LGPLv3",
					"Mozilla Public License 2.0",
					"Apache License 2.0",
					"MIT License",
					"The Unlicense",
				],
			},
			{
				type: "select",
				name: "dependabot",
				label: "Dependabot",
				// expert: true,
				message: "Do you want to enable Dependabot?",
				hint: "(recommended)",
				initial: "no",
				choices: ["yes", "no"],
				resultTransform: makeBool,
			},
		],
	},
];

/** Only the questions */
export const questions = questionGroups
	.map((q) => q.questions)
	.reduce((arr, next) => arr.concat(...next), []);

export interface Answers {
	projectName: string;
	description?: string;
	keywords?: string[];

	packageManager: "npm" | "yarn";
	nodeVersion: 12 | 14 | 16;

	tools: ("ESLint" | "Prettier")[];
	releaseScript: boolean;
	indentation?: "Tab" | "Space (4)";
	quotes?: "single" | "double";

	authorName: string;
	authorEmail: string;
	authorGithub: string;
	gitRemoteProtocol: "HTTPS" | "SSH";
	gitCommit?: boolean;
	license: string;
	dependabot: boolean;
}

export function checkAnswers(answers: Partial<Answers>): void {
	for (const q of questions) {
		// We don't use dynamic question names
		const questionName = q.name as string;
		const answer = (answers as any)[questionName];
		const conditionFulfilled = testCondition(q.condition, answers);
		if (!q.optional && conditionFulfilled && answer == undefined) {
			// A required answer was not given
			throw new Error(`Missing answer "${questionName}"!`);
		} else if (!conditionFulfilled && answer != undefined) {
			// TODO: Find a fool-proof way to check for extraneous answers
			if (
				questions.filter((qq) => (qq.name as string) === questionName)
					.length > 0
			) {
				// For now, don't enforce conditions for questions with multiple branches
				continue;
			}
			// An extraneous answer was given
			throw new Error(`Extraneous answer "${questionName}" given!`);
		}
	}
}

export async function formatAnswers(
	answers: Record<string, any>,
): Promise<Record<string, any>> {
	for (const q of questions) {
		const conditionFulfilled = testCondition(q.condition, answers);
		if (!conditionFulfilled) continue;

		// Apply an optional transformation
		if (
			answers[q.name as string] != undefined &&
			typeof q.resultTransform === "function"
		) {
			const transformed = q.resultTransform(answers[q.name as string]);
			answers[q.name as string] =
				transformed instanceof Promise
					? await transformed
					: transformed;
		}
	}
	return answers;
}

export async function validateAnswers(
	answers: Answers,
	disableValidation: (keyof Answers)[] = [],
): Promise<void> {
	for (const q of questions) {
		const conditionFulfilled = testCondition(q.condition, answers);
		if (!conditionFulfilled) continue;
		if (q.action == undefined) continue;
		if (disableValidation.indexOf(q.name as keyof Answers) > -1) continue;

		const testResult = await q.action(
			answers[q.name as keyof Answers] as any,
		);
		if (typeof testResult === "string") {
			throw new Error(testResult);
		}
	}
}

export function getDefaultAnswer<T extends keyof Answers>(
	key: T,
): Answers[T] | undefined {
	// Apparently, it is not possible to make the return type depend on the
	// given object key: https://github.com/microsoft/TypeScript/issues/31672
	// So we cast to `any` until a solution emerges
	if (key === "keywords") {
		return [] as any;
	}
}
