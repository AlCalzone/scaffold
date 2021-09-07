import type { TemplateFunction } from "../src/lib/projectGen";
import { getFormattedLicense } from "../src/lib/tools";

export = (answers => {
	return getFormattedLicense(answers);
}) as TemplateFunction;
