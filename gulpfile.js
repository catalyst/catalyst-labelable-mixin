/* eslint-env node */

const gulp = require('gulp');
const buildProcess = require('@catalyst-elements/build-process');

buildProcess.setConfig('./package.json', {
  componenet: {
    name: 'catalyst-labelable-mixin'
  },

  publish: {
    masterBranch: 'master',
    prereleaseBranchRegex: /^external-build-process$/g
  },

  src: {
    entrypoint: 'mixin.mjs'
  }
});

for (const [taskName, taskFunction] of Object.entries(buildProcess.tasks)) {
  gulp.task(taskName, taskFunction(gulp));
}
