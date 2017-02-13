FROM nimbleplatform/nimble-base
MAINTAINER Salzburg Research <nimble-srfg@salzburgresearch.at>
ARG finalName
ENV JAR '/'$finalName
ADD $finalName $JAR
RUN touch $JAR
ENV PORT 9092
EXPOSE $PORT
ENTRYPOINT java -Djava.security.egd=file:/dev/./urandom -jar "$JAR"