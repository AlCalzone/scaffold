import type { TemplateFunction } from "../src/lib/scaffold";

const templateFunction: TemplateFunction = answers => {

	const useYarn = answers.packageManager==="yarn";

	const template = `
# No dot-directories except github/vscode
.*/
!.vscode/
!.github/

*.code-workspace
node_modules
nbproject

# Unneeded package files
${useYarn ? (
`.yarn/*
!.yarn/patches
!.yarn/releases
!.yarn/plugins
!.yarn/sdks
!.yarn/versions
.pnp.*
package-lock.json`) : (
`yarn.lock`)}
*.tgz

# Compiled source files
**/build
**/*.tsbuildinfo
*.map

# Windows stuff
Thumbs.db
`;
	return template.trim();
};

templateFunction.customPath = ".gitignore";
export = templateFunction;
