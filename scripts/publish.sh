#!/usr/bin/bash

cp -r ./README.md ./LICENSE ./dist ./src ./publish
npm publish ./publish/ --access public
rm -r ./publish/README.md ./publish/LICENSE ./publish/dist ./publish/src
