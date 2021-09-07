import { blueBright, gray, green, red, underline } from "ansi-colors";
import { prompt } from "enquirer";
import execa from "execa";
import * as fs from "fs-extra";
import * as path from "path";
import * as yargs from "yargs";
import {
	Answers,
	Question,
	QuestionGroup,
	questionGroups,
	testCondition,
} from "./lib/core/questions";
import { createFiles, File, writeFiles } from "./lib/projectGen";
import { error, getOwnVersion } from "./lib/tools";

export type ConditionalTitle = (
	answers: Record<string, any>,
) => string | undefined;

/** Define command line arguments */
const argv = yargs
	.env("PROJECT_GEN")
	.strict()
	.usage("Node.js project generator\n\nUsage: $0 [options]")
	.alias("h", "help")
	.alias("v", "version")
	.options({
		target: {
			alias: "t",
			type: "string",
			desc: "Output directory for generated files\n(default: current directory)",
		},
		replay: {
			alias: "r",
			type: "string",
			desc: "Replay answers from the given .project-gen.json file",
		},
		noInstall: {
			alias: "n",
			type: "boolean",
			default: false,
			desc: "Skip installation of dependencies",
		},
		install: {
			alias: "i",
			hidden: true,
			type: "boolean",
			default: false,
			desc: "Force installation of dependencies",
		},
	})
	.parseSync();

/** Where the output should be written */
const rootDir = path.resolve(argv.target || process.cwd());

/** Asks a series of questions on the CLI */
async function ask(): Promise<Answers> {
	let answers: Record<string, any> = { cli: true };

	if (!!argv.replay) {
		const replayFile = path.resolve(argv.replay);
		const json = await fs.readFile(replayFile, "utf8");
		answers = JSON.parse(json);
		answers.replay = replayFile;
	}

	async function askQuestion(q: Question): Promise<void> {
		if (testCondition(q.condition, answers)) {
			// Make properties dependent on previous answers
			if (typeof q.initial === "function") {
				q.initial = q.initial(answers);
			}
			while (true) {
				let answer: Record<string, any>;
				if (answers.hasOwnProperty(q.name as string)) {
					// answer was loaded using the "replay" feature
					answer = { [q.name as string]: answers[q.name as string] };
				} else {
					if (
						answers.expert !== "yes" &&
						q.expert &&
						q.initial !== undefined
					) {
						// In non-expert mode, prefill the default answer for expert questions
						answer = { [q.name as string]: q.initial };
					} else {
						// Ask the user for an answer
						try {
							answer = await prompt(q);
							// Cancel the process if necessary
							if (answer[q.name as string] == undefined)
								throw new Error();
						} catch (e) {
							error(
								(e as Error).message ||
									"Project generation canceled!",
							);
							return process.exit(1);
						}
					}
					// Apply an optional transformation
					if (typeof q.resultTransform === "function") {
						const transformed = q.resultTransform(
							answer[q.name as string],
						);
						answer[q.name as string] =
							transformed instanceof Promise
								? await transformed
								: transformed;
					}
					// Test the result
					if (q.action != undefined) {
						const testResult = await q.action(
							answer[q.name as string],
						);
						if (typeof testResult === "string") {
							error(testResult);
							continue;
						}
					}
				}
				// And remember it
				answers = { ...answers, ...answer };
				break;
			}
		}
	}

	const questionsAndText: (QuestionGroup | string | ConditionalTitle)[] = [
		"",
		green.bold(
			`
=======================================================
   Welcome to AlCalzone's Node.js project generator!
   version: ${getOwnVersion()}
=======================================================
			`.trim(),
		),
		"",
		gray(`You can cancel at any point by pressing Ctrl+C.`),
		(answers) => (!!answers.replay ? green(`Replaying file`) : undefined),
		(answers) => (!!answers.replay ? green(answers.replay) : undefined),
		...questionGroups,
		"",
		underline(
			"That's it. Please wait a minute while I get this working...",
		),
	];

	for (const entry of questionsAndText) {
		if (typeof entry === "string") {
			// Headlines
			console.log(entry);
		} else if (typeof entry === "function") {
			// Conditional headlines
			const text = entry(answers);
			if (text !== undefined) {
				console.log(text);
			}
		} else {
			// only print the headline if any of the questions are necessary
			if (
				entry.questions.find((qq) =>
					testCondition(qq.condition, answers),
				)
			) {
				console.log();
				console.log(underline(entry.headline));
			}
			for (const qq of entry.questions) {
				await askQuestion(qq);
			}
		}
	}
	return answers as Answers;
}

let currentStep = 0;
let maxSteps = 1;
function logProgress(message: string): void {
	console.log(blueBright(`[${++currentStep}/${maxSteps}] ${message}...`));
}

/** Whether dependencies should be installed */
const installDependencies = !argv.noInstall || !!argv.install;
/** Whether an initial build should be performed */
let needsBuildStep: boolean;
/** Whether the initial commit should be performed automatically */
let gitCommit: boolean;

/** CLI-specific functionality for creating the adapter directory */
async function setupProject_CLI(
	answers: Answers,
	files: File[],
): Promise<void> {
	const rootDirName = path.basename(rootDir);
	// make sure we are working in a directory called like the project
	const targetDir =
		rootDirName.toLowerCase() === answers.projectName
			? rootDir
			: path.join(rootDir, answers.projectName);
	await writeFiles(targetDir, files);

	if (installDependencies) {
		logProgress("Installing dependencies");
		await execa("npm", ["install", "--quiet"], { cwd: targetDir });

		if (needsBuildStep) {
			logProgress("Compiling source files");
			await execa("npm", ["run", "build"], {
				cwd: targetDir,
				stdout: "ignore",
			});
		}
	}

	if (gitCommit) {
		logProgress("Initializing git repo");
		// As described here: https://help.github.com/articles/adding-an-existing-project-to-github-using-the-command-line/
		const gitUrl =
			answers.gitRemoteProtocol === "HTTPS"
				? `https://github.com/${answers.authorGithub}/${answers.projectName}`
				: `git@github.com:${answers.authorGithub}/${answers.projectName}.git`;
		const gitCommandArgs = [
			["init"],
			["add", "."],
			["commit", "-m", "Initial commit"],
			["remote", "add", "origin", gitUrl],
		];
		for (const args of gitCommandArgs) {
			await execa("git", args, {
				cwd: targetDir,
				stdout: "ignore",
				stderr: "ignore",
			});
		}
	}

	console.log();
	console.log(blueBright("All done! Have fun programming! ") + red("♥"));
}

// Enable CI testing without stalling
if (process.env.TEST_STARTUP) {
	console.log(green("Startup test succeeded - exiting..."));
	throw process.exit(0);
}

(async function main() {
	const answers = await ask();

	if (installDependencies) {
		maxSteps++;
		needsBuildStep = true; // TypeScript!
		if (needsBuildStep) maxSteps++;
	}
	gitCommit = !!answers.gitCommit;
	if (gitCommit) maxSteps++;

	logProgress("Generating files");
	const files = await createFiles(answers);

	await setupProject_CLI(answers, files);
})().catch((error) => console.error(error));

process.on("exit", () => {
	if (fs.pathExistsSync("npm-debug.log")) fs.removeSync("npm-debug.log");
});
