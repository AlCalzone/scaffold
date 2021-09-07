import { readFile, TemplateFunction } from "../../../src/lib/projectGen";

const templateFunction: TemplateFunction = answers => {
	
	if (!answers.dependabot) return;

	return readFile("dependabot-auto-merge.raw.yml", __dirname);
};

templateFunction.customPath = ".github/workflows/dependabot-auto-merge.yml";
// Reformatting this would create mixed tabs and spaces
templateFunction.noReformat = true;
export = templateFunction;
