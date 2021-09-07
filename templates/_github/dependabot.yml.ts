import type { TemplateFunction } from "../../src/lib/scaffold";

const templateFunction: TemplateFunction = answers => {

	if (!answers.dependabot) return;

	const template = `
version: 2
updates:
- package-ecosystem: npm
  directory: "/"
  schedule:
    interval: monthly
    time: "04:00"
    timezone: Europe/Berlin
  open-pull-requests-limit: 5
  assignees:
  - ${answers.authorGithub}
  versioning-strategy: increase
`;
	return template.trimLeft();
};

templateFunction.customPath = ".github/dependabot.yml";
// Reformatting this would create mixed tabs and spaces
templateFunction.noReformat = true;
export = templateFunction;
