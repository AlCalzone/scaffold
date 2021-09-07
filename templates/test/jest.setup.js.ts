import type { TemplateFunction } from "../../src/lib/scaffold";

const templateFunction: TemplateFunction = answers => {

	if (answers.testing !== "jest") return;

	const template = `
// Don't let unhandled rejections slip through during tests
process.on("unhandledRejection", (r) => {
	throw r;
});
`;
	return template.trim();
};

export = templateFunction;
