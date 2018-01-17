node ('nimble-jenkins-slave') {

    try {
	
		notifyBuild('STARTED')
	
		stage('Clone and Update') {
			git(url: 'https://github.com/nimble-platform/frontend-service.git', branch: env.BRANCH_NAME)
		}

		stage('Build Application') {
			sh 'mvn clean install'
		}

		stage ('Build Docker') {
			sh 'docker build -t nimbleplatform/frontend-service ./target'
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
		
	} catch (e) {
		currentBuild.result = "FAILED"
		throw e
	}
	finally {
		notifyBuild(currentBuild.result)
	}
	
}

def notifyBuild(String buildStatus = 'STARTED') {
	buildStatus =  buildStatus ?: 'SUCCESSFUL'
	def colorName = 'RED'
	def colorCode = '#FF0000'
	def subject = "${buildStatus}: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'"
	def summary = "${subject} (${env.BUILD_URL})"
	def details = """<p>STARTED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]':</p>
	<p>Check console output at &QUOT;<a href='${env.BUILD_URL}'>${env.JOB_NAME} [${env.BUILD_NUMBER}]</a>&QUOT;</p>"""
	if (buildStatus == 'STARTED') {
		color = 'YELLOW'
		colorCode = '#FFFF00'
	} else if (buildStatus == 'SUCCESSFUL') {
		color = 'GREEN'
		colorCode = '#00FF00'
	} else {
		color = 'RED'
		colorCode = '#FF0000'
	}
	slackSend (color: colorCode, message: summary)
}