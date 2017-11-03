node ('nimble-jenkins-slave') {
    
    stage('Clone and Update') {
        git(url: 'https://github.com/nimble-platform/frontend-service.git', branch: env.BRANCH_NAME)
    }

    stage('Build Application') {
        sh 'npm install'
    	sh 'mvn install'
    }

    stage ('Build Docker') {
        sh 'docker build -t nimbleplatform/frontend-service ./target'
    }

    if (env.BRANCH_NAME == 'master') {
        stage('Deploy') {
            sh 'ssh nimble "cd /data/nimble_setup/ && sudo ./run-prod.sh restart-single frontend-service"'
        }
    }

    // Kubernetes is disabled for now
    //if (env.BRANCH_NAME == 'master') {
	//   stage ('Push Docker image') {
	//        withDockerRegistry([credentialsId: 'NimbleDocker']) {
	//            sh '/bin/bash -xe deploy.sh docker-push'
	//        }

	//    }
    //
	//    stage ('Apply to Cluster') {
	//        sh 'kubectl apply -f kubernetes/deploy.yml -n prod --validate=false'
	//    }
	//}
}

