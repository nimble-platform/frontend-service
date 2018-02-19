    #!/usr/bin/env bash

    set -e

    if [ "$1" == "docker-build" ]; then

		if [ "$2" == "dev" ]; then
			mvn clean install -Denv=dev
		elif [ "$2" == "k8s" ]; then
			mvn clean install -Denv=prod
		elif [ "$2" == "staging" ]; then
			mvn clean install -Denv=staging
		else
			mvn clean install -Denv=prod
		fi
        docker build -t nimbleplatform/frontend-service ./target

    elif [ "$1" == "docker-run" ]; then

        docker run \
            -it \
            --rm \
            -p 9092:8080 \
            --name nimble-core_frontend-service \
            nimbleplatform/frontend-service

    elif [ "$1" == "docker-push" ]; then

        docker push nimbleplatform/frontend-service:latest

    fi
