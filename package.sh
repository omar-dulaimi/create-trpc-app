#!/bin/bash
# Assemble the publishable package into ./package.
set -euo pipefail

START_TIME=$SECONDS

echo "Building package..."
rm -rf dist package
npm run build

mkdir package
cp -r dist package
echo "Copying files..."
cp package.json README.md LICENSE package

echo "Preparing the published manifest..."
# Strip the repository's development surface from the manifest that ships.
#
# `scripts.prepare` ran `husky` inside package/ during `npm pack` and
# `npm publish`, where there is no .git. Husky printed ".git can't be found"
# with no trailing newline, so the tarball filename npm writes to stdout ran
# straight into it: `.git can't be foundcreate-trpc-appx-1.0.2.tgz`. The 26
# devDependencies were advertised to every consumer for no reason.
#
# `private` is removed because the repository root sets `"private": true` so
# that a stray `npm publish` there fails; this directory is the only
# publishable one. The old `sed 's/"private": true/"private": false/'` matched
# nothing, because the root had no `private` key to rewrite.
node --input-type=module -e '
import { readFileSync, writeFileSync } from "node:fs";
const manifestPath = "./package/package.json";
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
delete manifest.scripts;
delete manifest.devDependencies;
delete manifest.private;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
'

ELAPSED_TIME=$((SECONDS - START_TIME))
echo "Done in $ELAPSED_TIME seconds!"
