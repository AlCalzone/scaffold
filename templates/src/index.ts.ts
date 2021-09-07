import type { TemplateFunction } from "../../src/lib/scaffold";

export = (_answers => {

	const template = `
console.log("Hello World!");
`;
	return template.trim();
}) as TemplateFunction;
