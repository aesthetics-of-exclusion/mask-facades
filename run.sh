#!/bin/bash

set -e

n=$1

for ((i=0; i < n; i++)); do
  ./index.js
  sleep 5
done
