#!/bin/bash

if [[ -z "$TARGET_ENVIRONMENT" ]]; then
    echo "TARGET_ENVIRONMENT not set, keeping default globals"
else
    echo "setup frontend-service for target environment '$TARGET_ENVIRONMENT'"

    WD=`pwd`
    cd /tmp
    jar -xf /usr/local/tomcat/webapps/ROOT.war environments/
    mkdir app
    mkdir -p assets/css
    mv environments/globals.${TARGET_ENVIRONMENT}.ts app/globals.ts
    mv environments/globals.${TARGET_ENVIRONMENT}.js app/globals.js
    mv environments/globals.${TARGET_ENVIRONMENT}.js.map app/globals.js.map
    mv environments/global-styles.${TARGET_ENVIRONMENT}.css assets/css/global-styles.css
    jar -uf /usr/local/tomcat/webapps/ROOT.war assets/css/
    jar -uf /usr/local/tomcat/webapps/ROOT.war app/
    rm -r environments/ app/ assets/

    cd $WD
fi

# start tomcat, optionally with jpda
catalina.sh ${JPDA} run
