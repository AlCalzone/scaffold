module.exports = {
	testEnvironment: "node",
	roots: [
		"<rootDir>/packages/package-1/src",
		// Add others as necessary
	],
	testRegex: "(.|/)test.tsx?$",
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	moduleNameMapper: {
		"^@test-project/(.*)/package.json": "<rootDir>/packages/$1/package.json",
		"^@test-project/package-1(.*)": "<rootDir>/packages/package-1/src$1",
		// Add others as necessary
	},
	setupFilesAfterEnv: ["jest-extended"],
	setupFiles: ["./test/jest.setup.js"],
	collectCoverage: false,
	collectCoverageFrom: ["packages/**/src/**/*.ts", "!packages/**/src/**/*.test.ts"],
	coverageReporters: ["lcov", "html", "text-summary"],
	transform: {
		"^.+.tsx?$": "babel-jest",
	},
};
