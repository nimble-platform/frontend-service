node('nimble-jenkins-slave') {

    stage('Clone and Update') {
        git(url: 'https://github.com/nimble-platform/frontend-service.git', branch: env.BRANCH_NAME)
    }

    if (env.BRANCH_NAME == 'staging') {

        stage('Build Application') {
            sh 'mvn clean install -Denv=staging'
        }

        stage('Build Docker') {
            sh 'docker build -t nimbleplatform/frontend-service:staging ./target'
        }

        stage('Push Docker') {
            sh 'docker push nimbleplatform/frontend-service:staging'
        }

        stage('Deploy') {
            sh 'ssh staging "cd /srv/nimble-staging/ && ./run-staging.sh restart-single frontend-service"'
        }
    } else if (env.BRANCH_NAME == 'master') {

        stage('Build Application') {
            sh 'mvn clean install -Denv=prod'
        }

        stage('Build Docker') {
            sh 'docker build -t nimbleplatform/frontend-service ./target'
        }

        stage('Push Docker') {

            sh 'docker push nimbleplatform/frontend-service:latest'

            sh 'VERSION=$(./deploy.sh print-version)'
            sh 'docker tag nimbleplatform/frontend-service:latest nimbleplatform/frontend-service:$VERSION'
            sh 'docker push nimbleplatform/frontend-service:$VERSION'
        }
}
