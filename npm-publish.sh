mkdir temp

cp ./package.json ./temp/package.json
cp -r ./dist ./temp/dist
cp ./README.md ./temp/README.md
cp ./LICENSE ./temp/LICENSE

npm publish ./temp

rm -rf temp
