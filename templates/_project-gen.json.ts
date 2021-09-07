import type { TemplateFunction } from "../src/lib/projectGen";

const templateFunction: TemplateFunction = answers => {

	return JSON.stringify(answers, undefined, '\t');
};

templateFunction.customPath = ".project-gen.json";
export = templateFunction;
