#!/usr/bin/env bash

set -e    # Exit immediately if a command exits with a non-zero status.

if [ "$1" == "docker-build" ]; then

    # build project and docker image
    mvn clean package docker:build

elif [ "$1" == "docker-run" ]; then

    # start up container
    docker run \
        -p 9092:9092 \
        --env-file ./src/main/docker/env_vars \
        --name nimble-core_frontend-service \
        --rm \
        --net=nimbleinfra_default \
        nimbleplatform/frontend-service

fi

