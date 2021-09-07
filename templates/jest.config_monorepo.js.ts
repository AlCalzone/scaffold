import type { TemplateFunction } from "../src/lib/scaffold";

// This is the monorepo version
const templateFunction: TemplateFunction = answers => {

	if (answers.testing !== "jest") return;
	if (!answers.monorepo) return;

	const projectName = answers.projectName;
	const packageName = answers.monorepoPackageName!;

	const template = `
module.exports = {
	testEnvironment: "node",
	roots: [
		"<rootDir>/packages/${packageName}/src",
		// Add others as necessary
	],
	testRegex: "(\\.|/)test\\.tsx?$",
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	moduleNameMapper: {
		"^@${projectName}/(.*)/package.json": "<rootDir>/packages/$1/package.json",
		"^@${projectName}/${packageName}(.*)": "<rootDir>/packages/${packageName}/src$1",
		// Add others as necessary
	},
	setupFilesAfterEnv: ["jest-extended"],
	setupFiles: ["./test/jest.setup.js"],
	collectCoverage: false,
	collectCoverageFrom: [
		"packages/**/src/**/*.ts",
		"!packages/**/src/**/*.test.ts",
	],
	coverageReporters: ["lcov", "html", "text-summary"],
	transform: {
		"^.+\\.tsx?$": "babel-jest",
	},
};
`;
	return template.trim();
};
templateFunction.customPath = "jest.config.js";

export = templateFunction;
