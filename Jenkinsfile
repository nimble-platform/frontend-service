node ('nimble-jenkins-slave') {
	
	stage('Clone and Update') {
		git(url: 'https://github.com/nimble-platform/frontend-service.git', branch: env.BRANCH_NAME)
	}

	stage('Build Application') {
		sh 'mvn clean install'
	}

	stage ('Build Docker') {
		sh 'docker build -t nimbleplatform/frontend-service ./target'
	}
	if (env.BRANCH_NAME == 'staging') {
			stage('Build Docker') {
		sh 'docker build -t nimbleplatform/frontend-service:staging ./target'
			}

			stage('Push Docker') {
				sh 'docker push nimbleplatform/frontend-service:staging'
			}

			stage('Deploy') {
				sh 'ssh staging "cd /srv/nimble-staging/ && ./run-staging.sh restart-single frontend-serivce"'
			}
		} else {
			stage ('Build Docker') {
				sh 'docker build -t nimbleplatform/frontend-service ./target'
			}
		}

	if (env.BRANCH_NAME == 'master') {
		stage('Deploy') {
//            sh 'docker pull nimbleplatform/frontend-service'
			sh 'ssh nimble "cd /data/deployment_setup/prod/ && sudo ./run-prod.sh restart-single frontend-service"'
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
