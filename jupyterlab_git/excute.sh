#!/bin/bash
basePath="$1"
projectName="$2"
echo $basePath
echo $projectName
if [ $# -eq 0 ]; then
echo "No Arguments Provided, Aborting Process"
exit 1
else
echo "Directory Exists,1"
if [ -d "$basePath/$projectName" ]; then
echo "Directory Exists, Aborting Process"
exit 1
else
echo "Directory Doesnt Exist, Proceeding With Creating a New Directory"
mkdir "$basePath/$projectName"
exit 0
fi
fi