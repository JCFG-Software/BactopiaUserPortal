#!/bin/bash
# This script is used to validate environment, and run the application
# It is called by the Dockerfile

# Step 1: Check if the /work directory already exists
#   and is not empty
if [ -d "/work" ] && [ "$(ls -A /work)" ]; then
    echo "Directory /work exists and is not empty. Starting application"
    # run app.js
    node /work/app.js
else
    echo "Directory /work does not exist or is empty, downloading data"
fi

# Step 2: Download data from https://github.com/JCFG-Software/BactopiaUserPortal/releases/download/data-v3/bactopia-samples.zip
##  and unzip to /work
wget 
unzip bactopiaruns.zip -d /work





