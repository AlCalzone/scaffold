import type { TemplateFunction } from "../../../src/lib/scaffold";

const templateFunction: TemplateFunction = answers => {

    // const useTypeScript = true; //answers.language === "TypeScript";
    const useESLint = !!answers.tools?.includes("ESLint");

    const latestNodeVersion = "14.x";
    const nodeMatrix = ["12.x", "14.x", "16.x"];
    const osMatrix = ["ubuntu-latest", "windows-latest", "macos-latest"]

    const pm = answers.packageManager;
    const runcmd = answers.packageManager === "yarn" ? "yarn" : "npm run";

    const template = `
name: Test and Release

# Run this job on all pushes and pull requests
# as well as tags with a semantic version
on:
    push:
        branches:
            - master
        tags:
            # normal versions
            - "v[0-9]+.[0-9]+.[0-9]+"
            # pre-releases
            - "v[0-9]+.[0-9]+.[0-9]+-**"
    pull_request: {}

jobs:
${useESLint ? (
`    lint:
        if: contains(github.event.head_commit.message, '[skip ci]') == false

        runs-on: ubuntu-latest

        strategy:
            matrix:
                node-version: [${latestNodeVersion}]

        steps:
            - name: Checkout code
              uses: actions/checkout@v2

            - name: Use Node.js \${{ matrix.node-version }}
              uses: actions/setup-node@v2
              with:
                  node-version: \${{ matrix.node-version }}
                  cache: '${pm}'

            - name: Install Dependencies
              run: ${pm === "yarn" ? "yarn install --immutable" : "npm ci"}

            - name: Compile TypeScript code
              run: ${runcmd} build

            - name: Run linters
              run: ${runcmd} lint
`) : ""}
    # Runs unit tests on all supported node versions and OSes
    unit-tests:
        if: contains(github.event.head_commit.message, '[skip ci]') == false

        runs-on: \${{ matrix.os }}
        strategy:
            matrix:
                node-version: [${nodeMatrix.join(", ")}]
                os: [${osMatrix.join(", ")}]
${(osMatrix.includes("windows-latest") && nodeMatrix.includes("8.x")) ? (
    // This is unnecessary but I'm leaving it here in case we need it again.
    // The else branch will never trigger
`                exclude:
                    # Don't test Node.js 8 on Windows. npm is weird here
                    - os: windows-latest
                      node-version: 8.x`
) :""}
        steps:
            - name: Checkout code
              uses: actions/checkout@v2

              - name: Use Node.js \${{ matrix.node-version }}
              uses: actions/setup-node@v2
              with:
                  node-version: \${{ matrix.node-version }}
                  cache: '${pm}'

            - name: Install Dependencies
              run: ${pm === "yarn" ? "yarn install --immutable" : "npm ci"}

            - name: Compile TypeScript code
              run: ${runcmd} build

            - name: Run unit tests
              run: ${runcmd} test
              
# TODO: To enable automatic npm releases, create a token on npmjs.org 
# Enter this token as a GitHub secret (with name NPM_TOKEN) in the repository options
# Then uncomment the following block:

#    # Deploys the final package to NPM
#    deploy:
#        needs: [${useESLint ? "lint, " : ""}unit-tests]
#
#        # Trigger this step only when a commit on any branch is tagged with a version number
#        if: |
#            contains(github.event.head_commit.message, '[skip ci]') == false &&
#            github.event_name == 'push' &&
#            startsWith(github.ref, 'refs/tags/v')
#
#        runs-on: ubuntu-latest
#        strategy:
#            matrix:
#                node-version: [${latestNodeVersion}]
#
#        steps:
#            - name: Checkout code
#              uses: actions/checkout@v2
#
#            - name: Use Node.js \${{ matrix.node-version }}
#              uses: actions/setup-node@v2
#              with:
#                  node-version: \${{ matrix.node-version }}
#                  cache: '${pm}'
#
#            - name: Extract the version and commit body from the tag
#              id: extract_release
#              # The body may be multiline, therefore newlines and % need to be escaped
#              run: |
#                  VERSION="\${{ github.ref }}"
#                  VERSION=\${VERSION##*/v}
#                  echo "::set-output name=VERSION::$VERSION"
#                  BODY=$(git show -s --format=%b)
#                  BODY="\${BODY//'%'/'%25'}"
#                  BODY="\${BODY//$'\\n'/'%0A'}"
#                  BODY="\${BODY//$'\\r'/'%0D'}"
#                  echo "::set-output name=BODY::$BODY"
#
#            - name: Install Dependencies
#              run: ${pm === "yarn" ? "yarn install --immutable" : "npm ci"}
#
#            - name: Create a clean build
#              run: ${runcmd} build
#
#            - name: Publish package to npm
#              run: |
#                  npm config set //registry.npmjs.org/:_authToken=\${{ secrets.NPM_TOKEN }}
#                  npm whoami
#                  npm publish
#
#            - name: Create Github Release
#              uses: actions/create-release@v1
#              env:
#                  GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
#              with:
#                  tag_name: \${{ github.ref }}
#                  release_name: Release v\${{ steps.extract_release.outputs.VERSION }}
#                  draft: false
#                  # Prerelease versions create prereleases on Github
#                  prerelease: \${{ contains(steps.extract_release.outputs.VERSION, '-') }}
#                  body: \${{ steps.extract_release.outputs.BODY }}
`;	return template.trimLeft();
};

templateFunction.customPath = ".github/workflows/test-and-release.yml";
// Reformatting this would create mixed tabs and spaces
templateFunction.noReformat = true;
export = templateFunction;
