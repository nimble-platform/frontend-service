node ('nimble-jenkins-slave') {
	stage('Clone and Update') {
		git(url: 'https://github.com/nimble-platform/frontend-service.git', branch: 'k8s-integration')
	}

    stage('Build Application') {
        sh 'mvn clean install -Denv=prod'
    }

    stage ('Build docker image') {
        sh 'mvn clean install -DskipTests'
        sh 'docker build -t nimbleplatform/frontend-service:${BUILD_NUMBER} ./target'
        sh 'sleep 5' // For the tag to populate
    }

    stage ('Push docker image') {
        withDockerRegistry([credentialsId: 'NimbleDocker']) {
            sh 'docker push nimbleplatform/frontend-service:${BUILD_NUMBER}'
        }
    }

    stage ('Deploy') {
        sh ''' sed -i 's/IMAGE_TAG/'"$BUILD_NUMBER"'/g' kubernetes/deploy.yml '''

        sh 'kubectl apply -f kubernetes/deploy.yml -n prod --validate=false'
        sh 'kubectl apply -f kubernetes/svc.yml -n prod --validate=false'
    }

    stage ('Print-deploy logs') {
        sh 'sleep 60'
        sh 'kubectl  -n prod logs deploy/frontend-service -c frontend-service'
    }
}
