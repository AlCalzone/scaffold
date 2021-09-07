import type { TemplateFunction } from "../../src/lib/projectGen";

export = (_answers => {

	const template = `
console.log("Hello World!");
`;
	return template.trim();
}) as TemplateFunction;
