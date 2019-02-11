# Development

## Getting the code

1.  Fork the repo.
2.  Clone your fork.
3.  Install [Node](https://nodejs.org/en/download/). It comes bundled with [yarn](https://yarnpkg.com/).
4.  Install the [dependencies](#dependencies)

## Dependencies

Project dependencies are managed through [Yarn](https://yarnpkg.com/lang/en/docs/install).

Install dependencies with:

```sh
yarn
```

## Building

### Build for development

```sh
yarn build
```

The -w flag can be given to watch automatically for changes and rebuild when they are observed.

A built module version of the component will be created in the build folder (`./build`):

### Build for production

```sh
yarn build -p
```

The following versions of the component will be created in the distribution folder (`./dist`):

* an es6+ module version
* an es5 minified script version

## Coding Style

This project uses [TSLint](https://palantir.github.io/tslint/) to lint TypeScript and [Sass Lint](https://github.com/sasstools/sass-lint) to lint Sass.

To test if your code is compliant, run:

```sh
yarn lint
```

## Docs

Note: This repo does not have it's own GitHub pages. Docs are hosted on the [Catalyst Elements Bundle](https://github.com/catalyst/CatalystElements)'s [GitHub pages](https://catalyst.github.io/CatalystElements).

Docs are displayed using the [iron-component-page](https://www.webcomponents.org/element/@polymer/iron-component-page).

To build the docs:

```sh
yarn build-docs
```

The -p flag can be given to build for the production environment.

The docs will be located under `./docs/`.

To view the docs, first start up a local webserver:

```sh
yarn serve
```

Then visit http://127.0.0.1:8081/
