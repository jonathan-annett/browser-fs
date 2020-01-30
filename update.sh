#!/bin/bash
cd "$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
../jszip-fs-wrap/update.sh
cd "$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
./update_git_repos.sh
node ./index.js --build
git add fs_jszip-browser.* index.js package.json browser-fs.* *.sh 
git commit -m "auto add"
git push
git rev-parse HEAD > ./.git_hash
