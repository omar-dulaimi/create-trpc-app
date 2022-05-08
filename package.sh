#!/bin/bash
START_TIME=$SECONDS

echo "Buidling package..."
rm -r dist
rm -r package
npm run build

mkdir package
cp -r dist package
echo "Copying files..."
cp package.json README.md LICENSE package

echo "Making package.json public..."
sed -i 's/"private": true/"private": false/' ./package/package.json
ELAPSED_TIME=$(($SECONDS - $START_TIME))
echo "Done in $ELAPSED_TIME seconds!"
