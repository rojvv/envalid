import { EnvError, EnvMissingError } from "./errors.ts";
import { CleanOptions, Spec, ValidatorSpec } from "./types.ts";
import { defaultReporter } from "./reporter.ts";

/**
 * Validate a single env var, given a spec object
 *
 * @throws EnvError - If validation is unsuccessful
 * @return - The cleaned value
 */
function validateVar<T>({
  spec,
  name,
  rawValue,
}: {
  name: string;
  rawValue: string | T;
  spec: Spec<T> & { _parse: (input: string) => T };
}) {
  if (typeof spec._parse !== "function") {
    throw new EnvError(`Invalid spec for "${name}"`);
  }

  const value = spec._parse(rawValue as string);

  if (spec.choices) {
    if (!Array.isArray(spec.choices)) {
      throw new TypeError(`"choices" must be an array (in spec for "${name}")`);
    } else if (!spec.choices.includes(value)) {
      throw new EnvError(`Value "${value}" not in choices [${spec.choices}]`);
    }
  }

  if (value == null) throw new EnvError(`Invalid value for env var "${name}"`);
  return value;
}

// Format a string error message for when a required env var is missing
function formatSpecDescription<T>(spec: Spec<T>) {
  const egText = spec.example ? ` (eg. "${spec.example}")` : "";
  const docsText = spec.docs ? `. See ${spec.docs}` : "";
  return `${spec.desc}${egText}${docsText}`;
}

const readRawEnvValue = <T>(env: unknown, k: keyof T): string | T[keyof T] => {
  return (env as any)[k];
};

/**
 * Perform the central validation/sanitization logic on the full environment object
 */
export function getSanitizedEnv<T extends object>(
  environment: unknown,
  specs: { [K in keyof T]: ValidatorSpec<T[K]> },
  options: CleanOptions<T> = {}
): T {
  let cleanedEnv = {} as T;
  const errors: Partial<Record<keyof T, Error>> = {};
  const varKeys = Object.keys(specs) as Array<keyof T>;

  for (const k of varKeys) {
    const spec = specs[k];

    const rawValue = readRawEnvValue(environment, k) ?? spec.default;

    // Default values can be anything falsy (including an explicitly set undefined), without
    // triggering validation errors:
    const usingFalsyDefault =
      spec.hasOwnProperty("default") && spec.default === rawValue;

    try {
      if (rawValue === undefined) {
        if (!usingFalsyDefault) {
          throw new EnvMissingError(formatSpecDescription(spec));
        }

        cleanedEnv[k] = undefined!;
      } else {
        cleanedEnv[k] = validateVar({ name: k as string, spec, rawValue });
      }
    } catch (err) {
      if (options?.reporter === null) throw err;
      errors[k] = err;
    }
  }

  const reporter = options?.reporter || defaultReporter;
  reporter({ errors, env: cleanedEnv });
  return cleanedEnv;
}
