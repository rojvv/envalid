import {
  white,
  blue,
  yellow,
} from "https://deno.land/std@0.110.0/fmt/colors.ts";
import { EnvMissingError } from "./errors.ts";
import { ReporterOptions } from "./types.ts";

// The default reporter is supports a second argument, for consumers
// who want to use it with only small customizations
type ExtraOptions<T> = {
  onError?: (errors: Partial<Record<keyof T, Error>>) => void;
  logger: (output: string) => void;
};

const defaultLogger = console.error.bind(console);

const RULE = white("================================");

export const defaultReporter = <T = any>(
  { errors = {} }: ReporterOptions<T>,
  { onError, logger }: ExtraOptions<T> = { logger: defaultLogger }
) => {
  if (!Object.keys(errors).length) return;

  const missingVarsOutput: string[] = [];
  const invalidVarsOutput: string[] = [];
  for (const [k, err] of Object.entries(errors)) {
    if (err instanceof EnvMissingError) {
      missingVarsOutput.push(`    ${blue(k)}: ${err.message || "(required)"}`);
    } else {
      invalidVarsOutput.push(
        `    ${blue(k)}: ${(err as Error)?.message || "(invalid format)"}`
      );
    }
  }

  // Prepend "header" output for each section of the output:
  if (invalidVarsOutput.length) {
    invalidVarsOutput.unshift(` ${yellow("Invalid")} environment variables:`);
  }
  if (missingVarsOutput.length) {
    missingVarsOutput.unshift(` ${yellow("Missing")} environment variables:`);
  }

  const output = [
    RULE,
    invalidVarsOutput.sort().join("\n"),
    missingVarsOutput.sort().join("\n"),
    yellow("\n Exiting with error code 1"),
    RULE,
  ]
    .filter((x) => !!x)
    .join("\n");

  logger(output);

  if (onError) {
    onError(errors);
  } else {
    Deno.exit(1);
  }
};
