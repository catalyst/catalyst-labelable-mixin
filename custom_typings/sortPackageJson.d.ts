declare module 'sort-package-json' {
  export = sortPackage;
  declare function sortPackage(packageJson: object, options: any): object;
}
