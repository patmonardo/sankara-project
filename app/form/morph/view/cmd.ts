import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

/**
 * Test runner for morphs command tests
 */
export async function runMorphTest(options: {
  /** Test file path - relative to this file */
  testFile: string;
  /** Known good output file - relative to this file */
  expectedOutputFile?: string;
  /** Where to save output */
  actualOutputFile?: string;
  /** Whether to update expected output with actual (use for initial test creation) */
  update?: boolean;
  /** Whether to throw on mismatch */
  failOnMismatch?: boolean;
  /** Filter specific test to run */
  testFilter?: string;
}) {
  const {
    testFile,
    expectedOutputFile = testFile.replace(/\.cmd\.ts$/, ".expected.txt"),
    actualOutputFile = testFile.replace(/\.cmd\.ts$/, ".actual.txt"),
    update = false,
    failOnMismatch = true,
    testFilter,
  } = options;

  console.log(`Running test: ${testFile}`);

  try {
    // Run the test file and capture output
    let command = `npx tsx ${testFile}`;
    if (testFilter) {
      command += ` --filter="${testFilter}"`;
    }

    const output = execSync(command, { encoding: "utf8" });

    // Save actual output
    fs.writeFileSync(actualOutputFile, output);
    console.log(`✓ Test output saved to ${actualOutputFile}`);

    // If update mode, just save as expected
    if (update) {
      fs.writeFileSync(expectedOutputFile, output);
      console.log(`✓ Expected output updated: ${expectedOutputFile}`);
      return { success: true, updated: true };
    }

    // Compare with expected output if it exists
    if (fs.existsSync(expectedOutputFile)) {
      const expected = fs.readFileSync(expectedOutputFile, "utf8");

      if (expected.trim() === output.trim()) {
        console.log(`✓ Test passed: Output matches expected`);
        return { success: true, updated: false };
      } else {
        // Generate diff
        const tempDiffFile = `${actualOutputFile}.diff`;
        try {
          execSync(
            `diff -u ${expectedOutputFile} ${actualOutputFile} > ${tempDiffFile}`
          );
          console.log(`✗ Test failed: Output differs from expected`);
          console.log(`Diff saved to: ${tempDiffFile}`);

          // Show a summary of differences
          const diffSummary = execSync(
            `diff --changed-group-format='%>' --unchanged-group-format='' ${expectedOutputFile} ${actualOutputFile} | head -n 20`,
            { encoding: "utf8" }
          );
          if (diffSummary) {
            console.log("\nFirst differences:");
            console.log(diffSummary);
            if (diffSummary.split("\n").length >= 20) {
              console.log("... (more differences, see diff file)");
            }
          }

          if (failOnMismatch) {
            throw new Error(
              `Test failed: Output differs from expected. See ${tempDiffFile}`
            );
          }

          return { success: false, updated: false, diffFile: tempDiffFile };
        } catch (diffError) {
          console.error("Error generating diff:", diffError);
          if (failOnMismatch) {
            throw new Error(`Test failed: Output differs from expected`);
          }
          return { success: false, updated: false };
        }
      }
    } else {
      console.log(`⚠ No expected output file found at ${expectedOutputFile}`);
      console.log(`  Run with update=true to create it`);

      if (failOnMismatch) {
        throw new Error(`Test failed: No expected output file`);
      }

      return { success: false, updated: false, reason: "no-expected-file" };
    }
  } catch (error) {
    console.error(`Error running test ${testFile}:`, error);
    throw error;
  }
}

/**
 * Run all tests in a directory
 */
export async function runAllTests(options: {
  /** Directory to scan for tests (relative to this file) */
  directory?: string;
  /** File pattern to match */
  pattern?: string;
  /** Whether to update expected outputs */
  update?: boolean;
  /** Stop on first failure */
  stopOnFailure?: boolean;
}) {
  const {
    directory = "./",
    pattern = "*.cmd.ts",
    update = false,
    stopOnFailure = false,
  } = options;

  console.log(`Running all tests in ${directory} matching ${pattern}`);

  // Convert glob pattern to a proper regular expression
  const patternAsRegex = pattern
    .replace(/\./g, "\\.") // Escape dots
    .replace(/\*/g, ".*"); // Convert * to .*

  const files = fs
    .readdirSync(directory)
    .filter((file) => new RegExp(`^${patternAsRegex}$`).test(file));

  console.log(`Found ${files.length} test files`);
  const results = [];

  for (const file of files) {
    try {
      const result = await runMorphTest({
        testFile: path.join(directory, file),
        update,
        failOnMismatch: stopOnFailure,
      });

      results.push({ file, ...result });

      if (stopOnFailure && !result.success) {
        console.log(`Stopping due to failure in ${file}`);
        break;
      }
    } catch (error) {
      console.error(`Error in test ${file}:`, error);
      results.push({ file, success: false, error });

      if (stopOnFailure) {
        console.log(`Stopping due to error in ${file}`);
        break;
      }
    }
  }

  // Summary
  console.log("\n===== TEST SUMMARY =====");
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${results.filter((r) => r.success).length}`);
  console.log(`Failed: ${results.filter((r) => !r.success).length}`);

  if (results.filter((r) => !r.success).length > 0) {
    console.log("\nFailed tests:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`- ${r.file}`);
      });
  }

  return {
    success: results.every((r) => r.success),
    results,
  };
}

// Support running this directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    console.log(`
Morph Test Runner

Usage:
  tsx cmd.ts [options] [test-file]

Options:
  --update            Update expected outputs
  --all               Run all tests in current directory
  --directory=<dir>   Specify test directory
  --filter=<pattern>  Only run tests matching pattern
  --stop-on-failure   Stop on first test failure
  --help              Show this help
`);
    process.exit(0);
  }

  const update = args.includes("--update");
  const stopOnFailure = args.includes("--stop-on-failure");

  if (args.includes("--all")) {
    // Run all tests
    const directoryArg = args.find((a) => a.startsWith("--directory="));
    const directory = directoryArg ? directoryArg.split("=")[1] : "./";

    runAllTests({ directory, update, stopOnFailure })
      .then((result) => {
        process.exit(result.success ? 0 : 1);
      })
      .catch((error) => {
        console.error("Error running tests:", error);
        process.exit(1);
      });
  } else {
    // Run specific test
    const testFile = args.find((a) => !a.startsWith("--")) || "";

    if (!testFile) {
      console.error("No test file specified");
      process.exit(1);
    }

    const filterArg = args.find((a) => a.startsWith("--filter="));
    const testFilter = filterArg ? filterArg.split("=")[1] : undefined;

    runMorphTest({ testFile, update, testFilter })
      .then((result) => {
        process.exit(result.success ? 0 : 1);
      })
      .catch((error) => {
        console.error("Error running test:", error);
        process.exit(1);
      });
  }
}
