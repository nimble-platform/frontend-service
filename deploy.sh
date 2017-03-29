#!/usr/bin/env bash

set -e

if [ "$1" == "docker-build" ]; then

    mvn clean install
	docker build -t nimbleplatform/frontend-service ./target

elif [ "$1" == "docker-run" ]; then

    docker run \
		-it \
		--rm \
		-p 9092:8080 \
		--name nimble-core_frontend-service \
        nimbleplatform/frontend-service

fi
