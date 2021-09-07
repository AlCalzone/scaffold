import type { TemplateFunction } from "../src/lib/scaffold";

// This is the non-monorepo version
const templateFunction: TemplateFunction = answers => {

	if (answers.testing !== "jest") return;
	if (answers.monorepo) return;

	const template = `
module.exports = {
	testEnvironment: "node",
	roots: ["<rootDir>/src"],
	testRegex: "(\\.|/)test\\.tsx?$",
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	setupFilesAfterEnv: ["jest-extended"],
	setupFiles: ["./test/jest.setup.js"],
	collectCoverage: false,
	collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts"],
	coverageReporters: ["lcov", "html", "text-summary"],
	transform: {
		"^.+\\.tsx?$": "babel-jest",
	},
};
`;
	return template.trim();
};

export = templateFunction;
