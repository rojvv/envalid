import {
  assertEquals,
  assertMatch,
  assertNotMatch,
} from "https://deno.land/std@0.153.0/testing/asserts.ts";
import {
  defaultReporter as mainReporterExport,
  envalidErrorFormatter as mainEnvalidErrorFormatter,
} from "./mod.ts";
import { defaultReporter, envalidErrorFormatter } from "./reporter.ts";
import { EnvError, EnvMissingError } from "./errors.ts";

class MockedFunction {
  // deno-lint-ignore no-explicit-any
  calls = new Array<any>();

  // deno-lint-ignore no-explicit-any
  func(...args: any[]) {
    this.calls.push(args);
  }

  reset() {
    this.calls = [];
  }
}

Deno.test("default reporter", async (t) => {
  const exitSpy = new MockedFunction();

  Object.assign(globalThis.Deno, { exit: exitSpy.func.bind(exitSpy) });

  await t.step(
    "default reporter should be exported from the top-level module",
    () => {
      assertEquals(mainReporterExport, defaultReporter);
    },
  );

  await t.step("simple usage for reporting a missing variable error", () => {
    exitSpy.reset();

    const logger = new MockedFunction();
    defaultReporter(
      {
        errors: { FOO: new EnvMissingError() },
        env: {},
      },
      { logger: logger.func.bind(logger) },
    );
    assertEquals(logger.calls.length, 2);

    const output1 = logger.calls[0]?.[0];
    assertMatch(output1, /Missing\S+ environment variables:/);
    assertMatch(output1, /FOO\S+/);
    assertMatch(output1, /\(required\)/);
    assertNotMatch(output1, /Invalid\S+ environment variables:/);

    const output2 = logger.calls[1]?.[0];
    assertMatch(output2, /Exiting with error code 1/);

    assertEquals(exitSpy.calls.length, 1);
    assertEquals(exitSpy.calls[0]?.[0], 1);
  });

  await t.step("simple usage for reporting an invalid variable error", () => {
    exitSpy.reset();

    const logger = new MockedFunction();
    defaultReporter(
      {
        errors: { FOO: new EnvError() },
        env: { FOO: 123 },
      },
      { logger: logger.func.bind(logger) },
    );
    assertEquals(logger.calls.length, 2);

    const output1 = logger.calls[0]?.[0];
    assertMatch(output1, /Invalid\S+ environment variables:/);
    assertMatch(output1, /FOO\S+/);
    assertMatch(output1, /\(invalid format\)/);
    assertNotMatch(output1, /Missing\S+ environment variables:/);

    const output2 = logger.calls[1]?.[0];
    assertMatch(output2, /Exiting with error code 1/);

    assertEquals(exitSpy.calls.length, 1);
    assertEquals(exitSpy.calls[0]?.[0], 1);
  });

  await t.step(
    "reporting an invalid variable error with a custom error message",
    () => {
      exitSpy.reset();

      const logger = new MockedFunction();
      defaultReporter(
        {
          errors: { FOO: new EnvError("custom msg") },
          env: { FOO: 123 },
        },
        { logger: logger.func.bind(logger) },
      );
      assertEquals(logger.calls.length, 2);

      const output1 = logger.calls[0]?.[0];
      assertMatch(output1, /Invalid\S+ environment variables:/);
      assertMatch(output1, /FOO\S+/);
      assertMatch(output1, /custom msg/);

      const output2 = logger.calls[1]?.[0];
      assertMatch(output2, /Exiting with error code 1/);

      assertEquals(exitSpy.calls.length, 1);
      assertEquals(exitSpy.calls[0]?.[0], 1);
    },
  );

  await t.step("does nothing when there are no errors", () => {
    exitSpy.reset();

    const logger = new MockedFunction();
    defaultReporter(
      {
        errors: {},
        env: { FOO: "great success" },
      },
      { logger: logger.func.bind(this) },
    );

    assertEquals(logger.calls.length, 0);
    assertEquals(exitSpy.calls.length, 0);
  });
});

Deno.test("envalidErrorFormatter", async (t) => {
  await t.step(
    "default formatter should be exported from the top-level module",
    () => {
      assertEquals(mainEnvalidErrorFormatter, envalidErrorFormatter);
    },
  );

  await t.step("simple usage for formatting a single error", () => {
    const logger = new MockedFunction();
    assertEquals(logger.calls.length, 0);
    envalidErrorFormatter(
      { FOO: new EnvMissingError() },
      logger.func.bind(logger),
    );
    assertEquals(logger.calls.length, 1);

    const output = logger.calls[0]?.[0];
    assertMatch(output, /Missing\S+ environment variables:/);
    assertMatch(output, /FOO\S+/);
    assertMatch(output, /\(required\)/);
  });
});
