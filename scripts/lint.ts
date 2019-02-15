const args = process.argv.slice(2);

// Set the environment if it isn't set.
if (process.env.NODE_ENV === undefined) {
  // tslint:disable-next-line:no-object-mutation
  process.env.NODE_ENV = args.includes('--production') || args.includes('-p')
    ? 'production'
    : 'development';
}

const debug = args.includes('--debug');

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (error) => {
  // tslint:disable-next-line:no-throw
  throw error;
});

import chalk from 'chalk';
import {
  dirname,
  isAbsolute as isAbsolutePath,
  relative as relativePathBetween,
  resolve as resolvePath
} from 'path';
import { lint as styleLint, LinterResult as StyleLinterResult } from 'stylelint';
import {
  Configuration as TsLintConfiguration,
  Linter as TsLinter,
  LintResult as TsLintResult
} from 'tslint';

import { transpose } from './helpers/util';

/**
 * The maximum length a severity string can be.
 */
const severityMaxLength = 'warning'.length;

const tsConfigFileName = 'tsconfig.json';
const styleLintConfigFileName = '.stylelintrc.json';

// Start
(async (): Promise<void> => {
  return lint();

})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

/**
 * Lint the code.
 */
export async function lint(): Promise<void> {
  const mutable_ignoreFiles: Array<string> = [];

  const lintConfigResults = await lintConfig(mutable_ignoreFiles);
  if (lintConfigResults.ts !== undefined) {
    mutable_ignoreFiles.push(...lintConfigResults.ts.filesLinted);
  }

  const lintDocSrcResults = await lintDocSrc(mutable_ignoreFiles);
  if (lintDocSrcResults.ts !== undefined) {
    mutable_ignoreFiles.push(...lintDocSrcResults.ts.filesLinted);
  }

  const lintSrcResults = await lintSrc(mutable_ignoreFiles);
  if (lintSrcResults.ts !== undefined) {
    mutable_ignoreFiles.push(...lintSrcResults.ts.filesLinted);
  }

  const lintScriptsResults = await lintScripts(mutable_ignoreFiles);

  const lintingResults: ReadonlyArray<LintingResult> = [
    lintConfigResults,
    lintDocSrcResults,
    lintSrcResults,
    lintScriptsResults
  ];

  const result = lintingResults.reduce((mergedResults, lintingResult) => {
    const tsOutput =
      lintingResult.ts === undefined
        ? ''
        : formatTsLintResult(lintingResult.ts.result).output;

    const sassOutput =
      lintingResult.sass === undefined
        ? ''
        : formatStyleLintResult(lintingResult.sass.result).output;

    return {
      ts: `${mergedResults.ts}\n\n${tsOutput}`.trim(),
      sass: `${mergedResults.sass}\n\n${sassOutput}`.trim()
    };
  }, {
    ts: '',
    sass: ''
  });

  const formatHeading =
    (heading: string) =>
      chalk.underline(
        chalk.bold(
          chalk.cyanBright(
            heading
          )
        )
      );

  // Display the output.
  console.log('Linting complete.');
  console.log();
  console.log(formatHeading('TypeScript:'));
  console.log();
  console.log(result.ts);
  console.log();
  console.log();
  console.log(formatHeading('Sass:'));
  console.log();
  console.log(result.sass);
  console.log();
}

/**
 * Lint the source files.
 */
// tslint:disable-next-line: no-identical-functions
async function lintSrc(ignoreFiles: ReadonlyArray<string>): Promise<LintingResult> {
  console.log('Linting src files...');
  const tsConfigFile = resolvePath(process.cwd(), tsConfigFileName);
  const styleLintFile = resolvePath(process.cwd(), styleLintConfigFileName);

  const filesGlobby = [
    'src/**/*.scss'
  ].concat(ignoreFiles.map((file) => `!${file}`));

  const [ts, sass] = await Promise.all([
    lintTs(tsConfigFile, ignoreFiles),
    lintSass(styleLintFile, filesGlobby)
  ]);

  return {
    ts, sass
  };
}

/**
 * Lint the doc source files.
 */
// tslint:disable-next-line: no-identical-functions
async function lintDocSrc(ignoreFiles: ReadonlyArray<string>): Promise<LintingResult> {
  console.log('Linting doc src files...');
  const tsConfigFile = resolvePath(process.cwd(), 'docs-src', tsConfigFileName);
  const styleLintFile = resolvePath(process.cwd(), styleLintConfigFileName);

  const filesGlobby = [
    'docs-src/**/*.scss'
  ].concat(ignoreFiles.map((file) => `!${file}`));

  const [ts, sass] = await Promise.all([
    lintTs(tsConfigFile, ignoreFiles),
    lintSass(styleLintFile, filesGlobby)
  ]);

  return {
    ts, sass
  };
}

/**
 * Lint the script files.
 */
// tslint:disable-next-line: no-identical-functions
async function lintScripts(ignoreFiles: ReadonlyArray<string>): Promise<LintingResult> {
  console.log('Linting scripts...');
  const tsConfigFile = resolvePath(process.cwd(), 'scripts', tsConfigFileName);

  const ts = await lintTs(tsConfigFile, ignoreFiles);
  return { ts };
}

/**
 * Lint the config files.
 */
// tslint:disable-next-line: no-identical-functions
async function lintConfig(ignoreFiles: ReadonlyArray<string>): Promise<LintingResult> {
  console.log('Linting config files...');
  const tsConfigFile = resolvePath(process.cwd(), 'config', tsConfigFileName);

  const ts = await lintTs(tsConfigFile, ignoreFiles);
  return { ts };
}

/**
 * Lint the TypeScript for the given config file.
 *
 * @param configFile tsconfig.json file.
 * @param ignoreFiles Ignore these files.
 */
async function lintTs(configFile: string, ignoreFiles: ReadonlyArray<string>): Promise<LintingResult['ts']> {
  const program = TsLinter.createProgram(configFile);
  const files = TsLinter.getFileNames(program);
  const linter = new TsLinter({ fix: false }, program);

  const prelintResults = files.map((file) => {
    if (ignoreFiles.includes(file)) {
      return undefined;
    }

    const sourceFile = program.getSourceFile(file);
    if (sourceFile === undefined) {
      return new Error(`Failed to get source file for "${file}"`);
    }

    const fileContents = sourceFile.getFullText();
    const configuration = TsLintConfiguration.findConfiguration(`${dirname(configFile)}/tslint.json`, file).results;
    linter.lint(file, fileContents, configuration);

    return undefined;
  });

  // tslint:disable-next-line: no-loop-statement
  for (const prelintResult of prelintResults) {
    if (prelintResult !== undefined) {
      return Promise.reject(prelintResult);
    }
  }

  const result = linter.getResult();

  return {
    filesLinted: files,
    result
  };
}

/**
 * Lint the TypeScript for the given config file.
 *
 * @param configFile tsconfig.json file.
 * @param filesGlobby The files to lint.
 */
// tslint:disable-next-line: readonly-array
async function lintSass(configFile: string, filesGlobby: string | Array<string>): Promise<LintingResult['sass']> {
  const result = await styleLint({
    configFile,
    files: filesGlobby,
    syntax: 'scss'
  });

  const filesLinted = result.results.reduce((r, lintingResult) => (
    [
      ...r,
      lintingResult.source
    ]
  ), []);

  return {
    filesLinted,
    result
  };
}

/**
 * Print the result of running tslint.
 */
function formatTsLintResult(result: TsLintResult): LintingOutputResult {
  const errorsByFile = result.failures.reduce<ErrorsByFile>(
    (errors, failure) => {
      const filename = failure.getFileName();
      const existingFileErrors =
        errors[filename] === undefined
          ? []
          : errors[filename] as ReadonlyArray<LintingError>;

      const {
        line,
        character
      }: {
        readonly line: number;
        readonly character: number;
      } = failure
        .getStartPosition()
        .getLineAndCharacter();

      return {
        ...errors,
        [filename]: [
          ...existingFileErrors,
          {
            column: character + 1,
            line: line + 1,
            message: failure.getFailure(),
            rule: failure.getRuleName(),
            severity: failure.getRuleSeverity()
          }
        ]
      };
    },
    {}
  );

  const lintingOutput = getLintingOutput(errorsByFile);
  return {
    hasErrors: false, // TODO: return correct result.
    output: lintingOutput
  };
}

/**
 * Print the result of running stylelint.
 */
function formatStyleLintResult(result: StyleLinterResult): LintingOutputResult {
  const errorsByFile = result.results.reduce<ErrorsByFile>(
    (errors, lintResult) => {
      const filename = lintResult.source;
      const existingFileErrors =
        errors[filename] === undefined
          ? []
          : errors[filename] as ReadonlyArray<LintingError>;

      // Fix the typing of `lintResult.warnings`.
      const warnings = (lintResult.warnings as unknown as ReadonlyArray<{
        readonly line: number;
        readonly column: number;
        readonly rule: string;
        readonly severity: string;
        readonly text: string;
      }>);

      const fileErrors = warnings.map((warning) => ({
          column: warning.column,
          line: warning.line,
          message: warning.text,
          rule: warning.rule,
          severity: warning.severity
        } as LintingError)
      );

      return {
        ...errors,
        [filename]: [
          ...existingFileErrors,
          ...fileErrors
        ]
      };
    },
    {}
  );

  const lintingOutput = getLintingOutput(errorsByFile);
  return {
    hasErrors: false, // TODO: return correct result.
    output: lintingOutput
  };
}

/**
 * Get the complete linting output for a task.
 */
function getLintingOutput(errorsByFile: ErrorsByFile): string {
  return Object.entries(errorsByFile)
    .map((fileErrors) => getFileLintingOutput(fileErrors[0], fileErrors[1]))
    .reduce(
      (previous, current) =>
        current === ''
          ? previous
          : `${previous}${current}\n`,
      ''
    )
    .trimRight();
}

/**
 * Get the linting output for a file.
 */
function getFileLintingOutput(
  file: string,
  lintingErrors?: ReadonlyArray<LintingError>
): string {
  if (
    lintingErrors === undefined ||
    lintingErrors.length === 0 ||
    !lintingErrors.every(isRuleVialationError)
  ) {
    return '';
  }

  return `${getFilepathOutputForLintingJob(file)}\n${getLintingErrorsOutput(lintingErrors)}`;
}

function getFilepathOutputForLintingJob(filepath: string): string {
  if (isAbsolutePath(filepath)) {
    return chalk.yellow(`./${relativePathBetween(process.cwd(), filepath)}`);
  }
  return chalk.yellow(filepath);
}

function getLintingErrorsOutput(errors: ReadonlyArray<LintingError>): string {
  const [lineLength, colLength, ruleLength] = (() =>
    transpose<number>(
      errors
        .filter(isRuleVialationError)
        .map(
          (error) => [
            `${error.line}`.length,
            `${error.column}`.length,
            error.rule.length
          ]
        )
    )
      .map((lengths) => Math.max(...lengths)))();

  return errors
    .map((error) =>
      getLintingErrorOutput(error, lineLength, colLength, ruleLength)
    )
    .reduce((previous, current) => {
      if (current === '') {
        return previous;
      }
      return `${previous}  ${current}\n`;
    }, '');
}

/**
 * Get the output for a single linting error.
 */
function getLintingErrorOutput(
  error: LintingError,
  lineLength: number,
  colLength: number,
  ruleLength: number
): string {
  if (!isRuleVialationError(error)) {
    return '';
  }

  const ruleWithColor = `(${chalk.cyan(error.rule)}):`;

  const severity = (() => {
    if (error.severity === 'error') {
      return chalk.red(
        error.severity
          .toUpperCase()
          .padEnd(severityMaxLength)
      );
    }
    return chalk.green(
      error.severity
        .toUpperCase()
        .padEnd(severityMaxLength)
    );
  })();
  const line = chalk.magenta(`${error.line}`.padStart(lineLength));
  const column = chalk.magenta(`${error.column}`.padEnd(colLength));
  const rule = ruleWithColor.padEnd(
    ruleLength + ruleWithColor.length - error.rule.length
  );

  return `${severity} [${line}:${column}] ${rule} ${error.message}`;
}

/**
 * Returns true if the given error is a valid rule vialation.
 */
function isRuleVialationError(
  error: LintingError
): error is ValidLintingError {
  return error.rule !== undefined && error.severity !== 'off';
}

interface LintingResult {
  readonly ts?: {
    readonly filesLinted: ReadonlyArray<string>;
    readonly result: TsLintResult;
  };
  readonly sass?: {
    readonly filesLinted: ReadonlyArray<string>;
    readonly result: StyleLinterResult;
  };
}

interface LintingOutputResult {
  readonly hasErrors: boolean;
  readonly output: string;
}

interface ErrorsByFile {
  readonly [file: string]: ReadonlyArray<LintingError> | undefined;
}

interface LintingError {
  readonly column: number;
  readonly line: number;
  readonly message: string;
  readonly rule?: string;
  readonly severity: 'warning' | 'error' | 'off';
}

interface ValidLintingError extends LintingError {
  readonly rule: string;
}
