<div id="top"></div>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]


<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/omar-dulaimi/create-trpc-app">
    <img src="https://raw.githubusercontent.com/omar-dulaimi/create-trpc-app/master/logo.png" alt="Logo" width="150" height="150">
  </a>

  <h3 align="center">Create tRPC App</h3>

  <p align="center">
    The easiest way to get started with tRPC!
    <br />
    <a href="#options"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/omar-dulaimi/create-trpc-app/issues/new?template=bug_report.yml">Report Bug</a>
    ·
    <a href="https://github.com/omar-dulaimi/create-trpc-app/issues/new?template=feature_request.md">Request Feature</a>
  </p>
</div>

<p align="center">
  <a href="https://www.buymeacoffee.com/omardulaimi">
    <img src="https://cdn.buymeacoffee.com/buttons/default-black.png" alt="Buy Me A Coffee" height="41" width="174">
  </a>
</p>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#options">Options</a></li>
    <li>
      <a href="#why-use-create-trpc-app">Why use Create tRPC App?</a>
    </li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

The easiest way to get started with tRPC is by using `create-trpc-appx`. This CLI tool enables you to quickly start building a new tRPC application, with everything set up for you. You can create a new app using the default tRPC template, or by using one of the [official tRPC examples](https://github.com/trpc/trpc/tree/main/examples).

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

Some examples use yarn, so you may need to install it after creating a new project.

<!-- USAGE EXAMPLES -->

## Usage

To get started, use the following command:

```bash
npx create-trpc-appx@latest <FOLDER NAME>
# or
yarn create trpc-appx <FOLDER NAME>
# or
pnpm create trpc-appx <FOLDER NAME>
```

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- OPTIONS -->

## Options

`create-trpc-appx` comes with the following options:

- **-e, --example [name]|[github-url]** - An example to bootstrap the app with. You can use an example name from the [tRPC repo](https://github.com/trpc/trpc/tree/main/examples) or a GitHub URL. The URL can use any branch and/or subdirectory.
- **--example-path &lt;path-to-example&gt;** - In a rare case, your GitHub URL might contain a branch name with a slash (e.g. bug/fix-1) and the path to the example (e.g. foo/bar). In this case, you must specify the path to the example separately: `--example-path foo/bar`
- **--use-npm** - Explicitly tell the CLI to bootstrap the app using npm. To bootstrap using yarn we recommend to run `yarn create trpc-appx`
- **--use-pnpm** - Explicitly tell the CLI to bootstrap the app using pnpm. To bootstrap using pnpm we recommend running `pnpm create trpc-appx`

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- WHY USE CREATE TRPC APP -->

## Why use Create tRPC App?

`create-trpc-appx` allows you to create a new tRPC app within seconds. It includes a number of benefits:

- **Interactive Experience**: Running `npx create-trpc-appx` (with no arguments) launches an interactive experience that guides you through setting up a project.
- **Offline Support**: Create tRPC App will automatically detect if you're offline and bootstrap your project using your local package cache.
- **Support for Examples**: Create tRPC App can bootstrap your application using an example from the tRPC examples collection (e.g. `npx create-trpc-appx --example fastify-server`).

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

This project has been based on Create Next App, so a huge thank you goes to every and single one who worked on it.

Attribution for one of the icons used in the logo: <a href="https://www.flaticon.com/free-icons/design" title="design icons">Design icons created by monkik - Flaticon</a>

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/omar-dulaimi/create-trpc-app.svg?style=for-the-badge
[contributors-url]: https://github.com/omar-dulaimi/create-trpc-app/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/omar-dulaimi/create-trpc-app.svg?style=for-the-badge
[forks-url]: https://github.com/omar-dulaimi/create-trpc-app/network/members
[stars-shield]: https://img.shields.io/github/stars/omar-dulaimi/create-trpc-app.svg?style=for-the-badge
[stars-url]: https://github.com/omar-dulaimi/create-trpc-app/stargazers
[issues-shield]: https://img.shields.io/github/issues/omar-dulaimi/create-trpc-app.svg?style=for-the-badge
[issues-url]: https://github.com/omar-dulaimi/create-trpc-app/issues
[license-shield]: https://img.shields.io/github/license/omar-dulaimi/create-trpc-app?style=for-the-badge
[license-url]: https://github.com/omar-dulaimi/create-trpc-app/blob/master/LICENSE

