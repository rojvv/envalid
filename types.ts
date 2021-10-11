export interface Spec<T> {
  /**
   * An Array that lists the admissable parsed values for the env var.
   */
  choices?: ReadonlyArray<T>;
  /**
   * A fallback value, which will be used if the env var wasn't specified. Providing a default effectively makes the env var optional.
   */
  default?: T;
  /**
   * A fallback value to use only when DENO_ENV is not 'production'.
   * This is handy for env vars that are required for production environments, but optional for development and testing.
   */
  devDefault?: T;
  /**
   * A string that describes the env var.
   */
  desc?: string;
  /**
   * An example value for the env var.
   */
  example?: string;
  /**
   * A url that leads to more detailed documentation about the env var.
   */
  docs?: string;
}

export interface ValidatorSpec<T> extends Spec<T> {
  _parse: (input: string) => T;
}

export interface CleanedEnvAccessors {
  /** true if DENO_ENV === 'development' */
  readonly isDevelopment: boolean;
  readonly isDev: boolean;

  /** true if DENO_ENV === 'test' */
  readonly isTest: boolean;

  /** true if DENO_ENV === 'production' */
  readonly isProduction: boolean;
  readonly isProd: boolean;
}

export interface ReporterOptions<T> {
  errors: Partial<Record<keyof T, Error>>;
  env: unknown;
}

export interface CleanOptions<T> {
  /**
   * Pass in a function to override the default error handling and console output.
   * See ./reporter.ts for the default implementation.
   */
  reporter?: ((opts: ReporterOptions<T>) => void) | null;
}
