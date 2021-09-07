# AlCalzone's project scaffolding tool

Command line utility to quickly create a new TypeScript Node.js project.

## Prerequisites

Any computer with Node.js in version 14 or higher and npm 6 or higher.

## Usage

This tool is not supposed to be installed. Instead, run the most recent version using

```
npx @alcalzone/scaffold [options]
```

in the directory where the directory of your project should be created. You don't need to create the project directory, because it will be created for you.
**WARNING:** If the path contains a space, this [won't work](https://github.com/npm/npx/issues/14).

After a short while, you will be asked a few questions. Afterwards all the necessary files will be created for you.

### Options

The following CLI options are available:

-   `--target=/path/to/dir` - Specify which directory the project files should be created in (instead of the current dir). Shortcut: `-t`
-   `--replay=/path/to/file` - Re-run the scaffolding tool with the answers of a previous run (the given file needs to be the `.scaffold.json` in the root of the previously generated directory). Shortcut: `-r`

All CLI options can also be [provided as environment variables](https://yargs.js.org/docs/#api-reference-envprefix) by prepending `SCAFFOLD_`. Example: `SCAFFOLD_TARGET=/path/to/my/project`
