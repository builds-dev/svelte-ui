#!/bin/bash

glob_files () {
	glob-module-file --format=es --pathPrefix='../' --pattern "$1" --exportWithPath
}

GLOB="$1"
if [ -z "$1" ]; then
	GLOB="./{src,test,tests}/**/*.{spec,test}.svelte"
fi

glob_files "$GLOB" > build/test-components.js && rollup -c rollup.tests.config.js | browser-run $RUN_ARGS
