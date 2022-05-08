# Create tRPC App (based on create-next-app)

The easiest way to get started with tRPC is by using `create-trpc-app`. This CLI tool enables you to quickly start building a new tRPC application, with everything set up for you. You can create a new app using the default tRPC template, or by using one of the [official tRPC examples](https://github.com/trpc/trpc/tree/main/examples). To get started, use the following command:

```bash
npx create-trpc-app@latest
# or
yarn create trpc-app
# or
pnpm create trpc-app
```

To create a new app in a specific folder, you can send a name as an argument. For example, the following command will create a new tRPC app called `blog-app` in a folder with the same name:

```bash
npx create-trpc-app@latest blog-app
# or
yarn create trpc-app blog-app
# or
pnpm create trpc-app blog-app
```

## Options

`create-trpc-app` comes with the following options:

- **-e, --example [name]|[github-url]** - An example to bootstrap the app with. You can use an example name from the [tRPC repo](https://github.com/trpc/trpc/tree/main/examples) or a GitHub URL. The URL can use any branch and/or subdirectory.
- **--example-path &lt;path-to-example&gt;** - In a rare case, your GitHub URL might contain a branch name with a slash (e.g. bug/fix-1) and the path to the example (e.g. foo/bar). In this case, you must specify the path to the example separately: `--example-path foo/bar`
- **--use-npm** - Explicitly tell the CLI to bootstrap the app using npm. To bootstrap using yarn we recommend to run `yarn create trpc-app`
- **--use-pnpm** - Explicitly tell the CLI to bootstrap the app using pnpm. To bootstrap using pnpm we recommend running `pnpm create trpc-app`

## Why use Create tRPC App?

`create-trpc-app` allows you to create a new tRPC app within seconds. It is officially maintained by the creators of tRPC, and includes a number of benefits:

- **Interactive Experience**: Running `npx create-trpc-app` (with no arguments) launches an interactive experience that guides you through setting up a project.
- **Zero Dependencies**: Initializing a project is as quick as a couple of seconds. Create tRPC App has zero dependencies.
- **Offline Support**: Create tRPC App will automatically detect if you're offline and bootstrap your project using your local package cache.
- **Support for Examples**: Create tRPC App can bootstrap your application using an example from the tRPC examples collection (e.g. `npx create-trpc-app --example fastify-server`).

## Special Thanks

Huge thank you goes to the Next.js team and all contributors who worked on the create-next-app project, without them, this wouldn't have come to light this quickly.