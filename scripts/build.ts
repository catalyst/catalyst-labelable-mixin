const args = process.argv.slice(2);

// Set the environment if it isn't set.
if (process.env.NODE_ENV === undefined) {
  // tslint:disable-next-line:no-object-mutation
  process.env.NODE_ENV = args.includes('--production') || args.includes('-p')
    ? 'production'
    : 'development';
}

const watch = args.includes('--watch') || args.includes('-w');

const debug = args.includes('--debug');

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (error) => {
  // tslint:disable-next-line:no-throw
  throw error;
});

import * as funcs from './functions/build';

// Start
(async (): Promise<void> => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return funcs.buildDevelopment(watch, debug);
    case 'production':
      return funcs.buildProduction(watch, debug);
    default:
      return Promise.reject(new Error(`Cannot build: Unknown environment "${process.env.NODE_ENV}".`));
  }

})()
  .catch((error) => {
    // tslint:disable-next-line:no-throw
    throw error;
  });
