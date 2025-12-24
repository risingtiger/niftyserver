#!/bin/bash

set -e

project="$1"

if [ -z "$project" ]; then
	echo "Usage: $0 <purewatertech|xenition>"
	exit 1
fi

case "$project" in
	purewatertech) service="webapp" ;;
	xenition) service="xenwebapp" ;;
	*)
		echo "Unsupported project: $project"
		exit 1
	;;
esac

current_project="$(gcloud config get-value project)"

if [ "$current_project" != "$project" ]; then
	echo "gcloud must be configured to $project (current: $current_project)"
	exit 1
fi

echo "Deploying $service to $project project..."
gcloud run deploy "$service" --region='us-central1' --source
