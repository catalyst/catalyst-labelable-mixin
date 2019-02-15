export = index;
declare function index(packageJson: any, options: any): any;
declare namespace index {
  const sortOrder: string[];
  // Circular reference from index
  const sortPackageJson: any;
}
