# Frontend Service
Frontend Services for the Nimble Platform.

## Development

The complete frontend is developed with [Angular](https://angular.io) in TypeScript.

### With Node.js (aka. full development)
For development purposes it is advisable to set up [Node.js](https://nodejs.org/en/download/) on your machine since it delivers all possibly required functionality and provides way faster build cycles.

e.g. i18n
```shell
npm run i18n
```
Afterwards, copy src/messages.xlf to src/locale/messages.[LANGUAGE_TAG].xlf (e.g. messages.de.xlf) and add translations inside the target tags.

In order to install all the dependencies execute
```shell
npm install
```

In order to start the lite-server with BrowserSync (any file changes will be deployed on the fly during development) execute
```shell
npm start
```
The port can be adapted in bs-config.json (default is 9092).

### Without Node.js (aka. basic development / debugging only)
In case you don't want / need to set up a full-stack Node.js on your machine you can execute
```shell
mvn clean install
```
in order to install all the dependencies using a minified Node.js version pulled by Maven.

In order to start the lite-server with BrowserSync (any file changes will be deployed on the fly during development) execute
```shell
mvn deploy
```
The port can be adapted in bs-config.json (default is 9092).

## Deployment

### Local / Non-cloud
In order to install all the dependencies and build the WAR file (see target/frontend-service.war) for local deployment execute
```shell
mvn clean install
```

You can mount the WAR file on your preferred server or directly on Tomcat using Maven
```shell
mvn tomcat7:run-war
```

The port can be adapted in pom.xml (default is 9092).

### Docker / Cloud
In order to build the docker image execute
```shell
./deploy.sh docker-build
```
Alternative:
```shell
mvn clean install
docker build -t nimbleplatform/frontend-service ./target
```

In order to run the docker image execute
```shell
./deploy.sh docker-run
```
Alternative:
```shell
docker run -it --rm -p 9092:8080 --name nimble-core_frontend-service nimbleplatform/frontend-service
```

 ---
The project leading to this application has received funding from the European Union’s Horizon 2020 research and innovation programme under grant agreement No 723810.