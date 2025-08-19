import { execSync } from "child_process";
// Download repo with fallback: zipball, tarball, git clone
export async function downloadRepoWithFallback(root: string, info: RepoInfo): Promise<void> {
  // Try zipball via GitHub API
  try {
    const unzipper = await import('unzipper');
    const zipStream = got.stream(`https://api.github.com/repos/${info.username}/${info.name}/zipball/${info.branch}`);
    await new Promise((resolve, reject) => {
      zipStream
        .pipe(unzipper.Extract({ path: root }))
        .on('close', resolve)
        .on('error', reject);
    });
    return;
  } catch (e) {
    // Try public tarball
    try {
      await downloadAndExtractRepo(root, info);
      return;
    } catch (e2) {
      // Fallback to git clone
      try {
        execSync(`git clone --depth=1 --branch ${info.branch} https://github.com/${info.username}/${info.name}.git ${root}`);
        return;
      } catch (e3) {
        throw new Error("All download strategies failed: zipball, tarball, git clone.");
      }
    }
  }
}
/* eslint-disable import/no-extraneous-dependencies */
import got from "got";
import { pipeline } from "stream/promises";
import * as tar from "tar";

export type RepoInfo = {
  username: string;
  name: string;
  branch: string;
  filePath: string;
};

export async function isUrlOk(url: string): Promise<boolean> {
  const res = await got.head(url).catch((e) => e);
  return res.statusCode === 200;
}

export async function getRepoInfo(
  url: URL,
  examplePath?: string
): Promise<RepoInfo | undefined> {
  const [, username, name, t, _branch, ...file] = url.pathname.split("/");
  const filePath = examplePath
    ? examplePath.replace(/^\//, "")
    : file.join("/");

  // Support repos whose entire purpose is to be a tRPC example, e.g.
  // https://github.com/:username/:my-cool-trpc-example-repo-name.
  if (t === undefined) {
    const infoResponse = await got(
      `https://api.github.com/repos/${username}/${name}`
    ).catch((e) => e);
    if (infoResponse.statusCode !== 200) {
      return;
    }
    const info = JSON.parse(infoResponse.body);
    return { username, name, branch: info["default_branch"], filePath };
  }

  // If examplePath is available, the branch name takes the entire path
  const branch = examplePath
    ? `${_branch}/${file.join("/")}`.replace(new RegExp(`/${filePath}|/$`), "")
    : _branch;

  if (username && name && branch && t === "tree") {
    return { username, name, branch, filePath };
  }
}

export function hasRepo({
  username,
  name,
  branch,
  filePath,
}: RepoInfo): Promise<boolean> {
  const contentsUrl = `https://api.github.com/repos/${username}/${name}/contents`;
  const packagePath = `${filePath ? `/${filePath}` : ""}/package.json`;

  return isUrlOk(contentsUrl + packagePath + `?ref=${branch}`);
}

export function hasExample(name: string): Promise<boolean> {
  return isUrlOk(
    `https://api.github.com/repos/trpc/trpc/contents/examples/${encodeURIComponent(
      name
    )}/package.json`
  );
}

export function downloadAndExtractRepo(
  root: string,
  { username, name, branch, filePath }: RepoInfo
): Promise<void> {
  // @ts-expect-error
  return pipeline(
    got.stream(
      `https://codeload.github.com/${username}/${name}/tar.gz/${branch}`
    ),
    tar.extract(
      { cwd: root, strip: filePath ? filePath.split("/").length + 1 : 1 },
      [`${name}-${branch}${filePath ? `/${filePath}` : ""}`]
    )
  );
}

export function downloadAndExtractExample(
  root: string,
  name: string
): Promise<void> {
  if (name === "__internal-testing-retry") {
    throw new Error("This is an internal example for testing the CLI.");
  }
  // @ts-expect-error
  return pipeline(
    got.stream("https://codeload.github.com/trpc/trpc/tar.gz/main"),
    tar.extract({ cwd: root, strip: 3 }, [`trpc-main/examples/${name}`])
  );
}
