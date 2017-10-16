node ('nimble-jenkins-slave') {
    
    stage('Clone and Update') {
        git(url: 'https://github.com/nimble-platform/frontend-service.git', branch: 'master')
    }

    stage('Build Application') {
    	sh 'mvn install'
    }

    stage ('Build Docker') {
        sh 'docker build -t nimbleplatform/frontend-service ./target'
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

