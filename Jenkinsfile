node ('nimble-jenkins-slave') {
    def app
    stage('Clone and Update') {
        git(url: 'https://github.com/nimble-platform/frontend-service.git', branch: 'master')
    }

    stage ('Build Docker Image') {
        sh '/bin/bash -xe deploy.sh docker-build'
    }

    stage ('Push Docker image') {
        withDockerRegistry([credentialsId: 'NimbleDocker']) {
            sh '/bin/bash -xe deploy.sh docker-push'       
        }
    }

    stage ('Apply to Cluster') {
        sh 'kubectl apply -f kubernetes/deploy.yml -n prod --validate=false'
    }
}

