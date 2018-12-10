node('nimble-jenkins-slave') {

    stage('Clone and Update') {
	
        git(url: 'https://github.com/nimble-platform/frontend-service.git', branch: env.BRANCH_NAME)
		
    }

    if (env.BRANCH_NAME == 'staging') {

        stage('Build Application - MVP') {
            sh 'mvn clean install -Denv=staging'
        }

        stage('Build Docker - MVP') {
            sh 'docker build -t nimbleplatform/frontend-service:staging ./target'
        }

        stage('Push Docker - MVP') {
            sh 'docker push nimbleplatform/frontend-service:staging'
        }

        stage('Deploy - MVP') {
            sh 'ssh staging "cd /srv/nimble-staging/ && ./run-staging.sh restart-single frontend-service"'
        }
		
		stage('Build Application - FMP') {
            sh 'mvn clean install -Denv=fmp-staging'
        }

        stage('Build Docker - FMP') {
            sh 'docker build -t nimbleplatform/frontend-service:fmp-staging ./target'
        }

        stage('Push Docker - FMP') {
            sh 'docker push nimbleplatform/frontend-service:fmp-staging'
        }

        stage('Deploy - FMP') {
            sh 'ssh staging "cd /srv/nimble-staging/ && ./run-staging.sh restart-single frontend-service-fmp"'
        }
		
    } else if (env.BRANCH_NAME == 'master') {

        stage('Build Application - MVP') {
            sh 'mvn clean install -Denv=prod'
        }

        stage('Build Docker - MVP') {
            sh 'docker build -t nimbleplatform/frontend-service ./target'
        }

        stage('Push Docker - MVP') {

            sh 'docker push nimbleplatform/frontend-service:latest'

            sh 'VERSION=$(./deploy.sh print-version)'
            sh 'docker tag nimbleplatform/frontend-service:latest nimbleplatform/frontend-service:$VERSION'
            sh 'docker push nimbleplatform/frontend-service:$VERSION'
        }

        stage('Deploy - MVP') {
            sh 'ssh nimble "cd /data/deployment_setup/prod/ && sudo ./run-prod.sh restart-single frontend-service"'
        }

        stage('Build Application - FMP') {
            sh 'mvn clean install -Denv=fmp'
        }

        stage('Build Docker - FMP') {
            sh 'docker build -t nimbleplatform/frontend-service:fmp ./target'
        }

        stage('Push Docker - FMP') {
            sh 'docker push nimbleplatform/frontend-service:fmp'
        }

        stage('Deploy - FMP') {
            sh 'ssh fmp-prod "cd /srv/nimble-fmp/ && ./run-fmp-prod.sh restart-single frontend-service"'
        }
		
    }
}
