import type { TemplateFunction } from "../src/lib/projectGen";
import { getFormattedLicense } from "../src/lib/tools";

export = (answers => {

	const useTypeScript = true; //answers.language === "TypeScript";
	const useESLint = !!answers.tools?.includes("ESLint");
	const autoInitGit = !!answers.gitCommit
	const useReleaseScript = answers.releaseScript
	const useDependabot = answers.dependabot

	const npmScripts: Record<string, string> = {};
	if (useTypeScript) {
		npmScripts["build"] = "Compile the TypeScript sources.";
		npmScripts["watch"] = "Compile the TypeScript sources and watch for changes.";
	}
	if (useESLint) {
		npmScripts["lint"] = "Runs \`ESLint\` to check your code for formatting errors and potential bugs.";
	}
	if (useReleaseScript) {
		npmScripts["release"] = "Creates a new release, see [`@alcalzone/release-script`](https://github.com/AlCalzone/release-script#usage) for more details.";
	}

	const template = `
# ${answers.projectName}

${answers.description || "Describe your project here"}

## Developer manual
This section is intended for the developer. It can be deleted later

### Getting started

You are almost done, only a few steps left:
1. Create a new repository on GitHub with the name \`${answers.projectName}\`
${autoInitGit ? "" : (
`1. Initialize the current folder as a new git repository:  
	\`\`\`bash
	git init
	git add .
	git commit -m "Initial commit"
	\`\`\`
1. Link your local repository with the one on GitHub:  
	\`\`\`bash
	git remote add origin https://github.com/${answers.authorGithub}/${answers.projectName}
	\`\`\`
`)}
1. Push all files to the GitHub repo${autoInitGit ? ". The creator has already set up the local repository for you" : ""}:  
	\`\`\`bash
	git push origin master
	\`\`\`
${useDependabot ? (
`1. Add a new secret under https://github.com/${answers.authorGithub}/${answers.projectName}/settings/secrets. It must be named \`AUTO_MERGE_TOKEN\` and contain a personal access token with push access to the repository, e.g. yours. You can create a new token under https://github.com/settings/tokens.
`) : ""}
1. Head over to [src/main.ts](src/main.ts) and start programming!

### Scripts in \`package.json\`
Several npm scripts are predefined for your convenience. You can run them using \`npm run <scriptname>\`
| Script name | Description |
|-------------|-------------|
${Object.entries(npmScripts).map(([name, desc]) => (
	`| \`${name}\` | ${desc} |`
)).join("\n")}

${useReleaseScript ? `Since you installed the release script, you can create a new
release simply by calling:
\`\`\`bash
npm run release
\`\`\`
Additional command line options for the release script are explained in the
[release-script documentation](https://github.com/AlCalzone/release-script#command-line).` : ""}

## Changelog
${useReleaseScript ? `<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->
` : ""}
### ${useReleaseScript ? "**WORK IN PROGRESS**" : "0.0.1"}
* (${answers.authorName}) initial release

## License
${getFormattedLicense(answers)}
`;
	return template.trim();
}) as TemplateFunction;
