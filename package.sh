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

echo "Making package.json public..."
sed -i 's/"private": true/"private": false/' ./package/package.json
ELAPSED_TIME=$((SECONDS - START_TIME))
echo "Done in $ELAPSED_TIME seconds!"
