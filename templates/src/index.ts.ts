import type { TemplateFunction } from "../../src/lib/scaffold";

export = (answers => {

	if (answers.monorepo) return;

	const template = `
console.log("Hello World!");
`;
	return template.trim();
}) as TemplateFunction;
