// Disable API requests while testing
process.env.TESTING = "true";

import execa from "execa";
import * as fs from "fs-extra";
import * as path from "path";
import { scaffold } from "../src/index";
import type { Answers } from "../src/lib/core/questions";
import { File, writeFiles } from "../src/lib/scaffold";

const baselineDir = path.join(__dirname, "../test/baselines");

async function generateBaselines(
	testName: string,
	answers: Answers,
	filterFilesPredicate?: (file: File) => boolean,
) {
	const files = await scaffold(answers);

	const testDir = path.join(baselineDir, testName);
	await fs.emptyDir(testDir);
	await writeFiles(
		testDir,
		typeof filterFilesPredicate === "function"
			? files.filter(filterFilesPredicate)
			: files,
	);

	// Include the npm package content in the baselines (only for full adapter tests)
	if (!filterFilesPredicate && files.some((f) => f.name === "package.json")) {
		const packTestDir = answers.monorepo
			? path.join(testDir, "packages", answers.monorepoPackageName!)
			: testDir;
		let packageContent = (
			await execa("npm", ["pack", "--dry-run"], {
				cwd: packTestDir,
				encoding: "utf8",
			})
		).stderr
			.replace(/^npm notice /gim, "")
			.trim();
		packageContent = packageContent.substr(
			packageContent.indexOf("=== Tarball"),
		);
		await fs.ensureDir(path.join(testDir, "__meta__"));
		await fs.writeFile(
			path.join(testDir, "__meta__/npm_package_files.txt"),
			packageContent,
		);
	}
}

async function expectSuccess(
	testName: string,
	answers: Answers,
	filterFilesPredicate?: (file: File) => boolean,
) {
	await generateBaselines(testName, answers, filterFilesPredicate);
}

// async function expectFail(
// 	testName: string,
// 	answers: Partial<Answers>,
// 	message: string,
// ) {
// 	await generateBaselines(
// 		testName,
// 		answers as Answers,
// 	).should.be.rejectedWith(message);
// 	const testDir = path.join(baselineDir, testName);
// 	await fs.pathExists(testDir).should.become(false);
// }

const baseAnswers: Answers = {
	projectName: "test-project",
	description: "Is used to test the scaffolder",
	// keywords: "" as any,

	packageManager: "yarn",
	nodeVersion: 14,

	tools: ["ESLint", "Prettier", "Commitlint"],
	monorepo: false,
	testing: "jest",
	releaseScript: true,
	indentation: "Tab",
	quotes: "double",

	authorName: "Al Calzone",
	authorGithub: "AlCalzone",
	authorEmail: "al@calzo.ne",
	gitRemoteProtocol: "HTTPS",

	license: "MIT License",
	dependabot: true,
};

describe("adapter creation =>", () => {
	// describe("incomplete answer sets should fail =>", () => {
	// 	it("only name", () => {
	// 		const answers = { adapterName: "foobar" };
	// 		expectFail("incompleteAnswersOnlyName", answers, "Missing answer");
	// 	});

	// 	it("no title", () => {
	// 		const { title, ...noTitle } = baseAnswers;
	// 		expectFail("incompleteAnswersNoTitle", noTitle, "Missing answer");
	// 	});

	// 	it("no type", () => {
	// 		const { type, ...noType } = baseAnswers;
	// 		expectFail("incompleteAnswersNoType", noType, "Missing answer");
	// 	});

	// 	it("empty title 1", () => {
	// 		const answers: Answers = {
	// 			...baseAnswers,
	// 			title: "",
	// 		};
	// 		expectFail(
	// 			"incompleteAnswersEmptyTitle",
	// 			answers,
	// 			"Please enter a title",
	// 		);
	// 	});

	// 	it("empty title 2", () => {
	// 		const answers: Answers = {
	// 			...baseAnswers,
	// 			title: "   ",
	// 		};
	// 		expectFail(
	// 			"incompleteAnswersEmptyTitle",
	// 			answers,
	// 			"Please enter a title",
	// 		);
	// 	});

	// 	it("invalid title 1", () => {
	// 		const answers: Answers = {
	// 			...baseAnswers,
	// 			title: "Adapter for ioBroker",
	// 		};
	// 		expectFail(
	// 			"incompleteAnswersEmptyTitle",
	// 			answers,
	// 			"must not contain the words",
	// 		);
	// 	});

	// 	it("selecting Prettier without ESLint", () => {
	// 		const answers: Answers = {
	// 			...baseAnswers,
	// 			tools: ["Prettier"],
	// 		};
	// 		expectFail(
	// 			"invalidAnswersPrettierWithoutESLint",
	// 			answers,
	// 			"ESLint must be selected",
	// 		);
	// 	});
	// });

	describe("generate baselines =>", function () {
		this.timeout(60000);

		before(async () => {
			// Clear the baselines dir, except for the README.md
			await fs.mkdirp(baselineDir);
			const files = await fs.readdir(baselineDir);
			await Promise.all(
				files
					.filter((file) => file !== "README.md")
					.map((file) => fs.remove(path.join(baselineDir, file))),
			);
		});

		describe("full adapter dir =>", () => {
			it("Default setup: yarn, Node 14, ESLint+Prettier+Commitlint, Jest, Release Script, Tab, Double Quotes, MIT, Dependabot", async () => {
				const answers: Answers = {
					...baseAnswers,
				};
				await expectSuccess("default", answers);
			});

			it("Mocha instead of Jest", async () => {
				const answers: Answers = {
					...baseAnswers,
					testing: "mocha",
				};
				await expectSuccess("mocha", answers);
			});

			it("No testing", async () => {
				const answers: Answers = {
					...baseAnswers,
					testing: "none",
				};
				await expectSuccess("no_testing", answers);
			});

			it("Monorepo", async () => {
				const answers: Answers = {
					...baseAnswers,
					monorepo: true,
					monorepoPackageName: "package-1",
				};
				await expectSuccess("monorepo", answers);
			});

			// it("Adapter, TypeScript (ES6 class), ESLint, Tabs, Double quotes, MIT License", async () => {
			// 	const answers: Answers = {
			// 		...baseAnswers,
			// 		es6class: "yes",
			// 	};
			// 	await expectSuccess(
			// 		"adapter_TS_ES6Class_ESLint_Tabs_DoubleQuotes_MIT",
			// 		answers,
			// 	);
			// });
		});

		// describe("Single-file component tests =>", () => {
		// 	it("Valid description", async () => {
		// 		const answers: Answers = {
		// 			...baseAnswers,
		// 			description: "This is a short description",
		// 		};
		// 		await expectSuccess(
		// 			"description_valid",
		// 			answers,
		// 			(file) => file.name === "io-package.json",
		// 		);
		// 	});

		// });
	});
});
