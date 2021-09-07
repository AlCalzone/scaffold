import type { TemplateFunction } from "../src/lib/scaffold";

const templateFunction: TemplateFunction = answers => {

	return JSON.stringify(answers, undefined, '\t');
};

templateFunction.customPath = ".scaffold.json";
export = templateFunction;
