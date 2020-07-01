#!/bin/bash

# const SERVICE_KEY = process.env.SERVICE_KEY
n=$1

for ((i=0; i < n; i++)); do
  ./index.js
done

