#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR

# const SERVICE_KEY=/Users/bert/.google-cloud/streetswipe-aoe-5627f5cc075a.json
n=$1

for ((i=0; i < n; i++)); do
  ./index.js
done
