#!/usr/bin/bash

cp -r ./package.json ./README.md ./LICENSE ./dist ./src ./publish
npm publish ./publish/ --access public
rm -r ./publish/package.json ./publish/README.md ./publish/LICENSE ./publish/dist ./publish/src
