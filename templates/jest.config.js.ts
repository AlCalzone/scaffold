import type { TemplateFunction } from "../src/lib/scaffold";

const templateFunction: TemplateFunction = answers => {

	if (answers.testing !== "jest") return;

	const template = `
module.exports = {
	testEnvironment: "node",
	roots: ["<rootDir>/src"],
	testRegex: "(\\.|/)test\\.tsx?$",
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	setupFilesAfterEnv: ["jest-extended"],
	collectCoverage: false,
	collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts"],
	coverageReporters: ["lcov", "html", "text-summary"],
};
`;
	return template.trim();
};

export = templateFunction;
