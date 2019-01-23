FROM tomcat:8-jre8
MAINTAINER Salzburg Research <nimble-srfg@salzburgresearch.at>

# install jdk (we need 'jar' in 'entrypoint.sh')
RUN apt-get update && apt-get install -y openjdk-8-jdk

RUN rm -rf /usr/local/tomcat/webapps/ROOT
ADD frontend-service.war /usr/local/tomcat/webapps/ROOT.war

ADD entrypoint.sh /
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]