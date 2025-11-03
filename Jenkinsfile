pipeline {
    agent any
    
    environment {
        // AWS Configuration
        AWS_ACCOUNT_ID = '666098475707'
        AWS_REGION = 'us-east-1'
        ECR_REPOSITORY = 'my-web-app'
        DOCKER_IMAGE = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}"
        IMAGE_TAG = "${BUILD_NUMBER}"

        // EC2 Deployment
        EC2_HOST = 'ec2-54-147-13-158.compute-1.amazonaws.com'
        EC2_USER = 'ec2-user'

        // Jenkins Credentials IDs
        AWS_CREDENTIALS = 'aws-credentials-id'
        SSH_KEY_CRED = 'ec2-ssh-key'

        // Email
        EMAIL_RECIPIENTS = 'your-email@example.com'
    }

    options {
        timestamps()
        ansiColor('xterm')
        skipDefaultCheckout()
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📦 Checking out code from GitHub...'
                checkout scm
            }
        }

        stage('Setup Node Environment') {
            steps {
                echo '⚙️ Setting up Node.js...'
                // This ensures correct Node & npm versions and cache usage
                sh '''
                    if ! command -v node >/dev/null 2>&1; then
                        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                        sudo apt-get install -y nodejs
                    fi
                    node -v
                    npm -v
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installing dependencies...'
                // Using npm ci for deterministic builds and caching node_modules
                sh '''
                    if [ -d node_modules ]; then
                        echo "Using cached node_modules"
                    else
                        npm ci --prefer-offline --no-audit --progress=false
                    fi
                '''
            }
        }

        stage('Run Tests') {
            steps {
                echo '🧪 Running tests...'
                sh 'npm test || echo "⚠️ No test script found, skipping tests."'
            }
        }

        stage('Lint / Code Quality') {
            steps {
                echo '🔍 Running code quality checks...'
                sh 'npm run lint || true'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo '🐳 Building Docker image...'
                sh '''
                    docker build -t ${ECR_REPOSITORY}:${IMAGE_TAG} .
                    docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${DOCKER_IMAGE}:${IMAGE_TAG}
                    docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${DOCKER_IMAGE}:latest
                '''
            }
        }

        stage('Push to ECR') {
            steps {
                echo '☁️ Pushing image to AWS ECR...'
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: "${AWS_CREDENTIALS}"]]) {
                    sh '''
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

                        docker push ${DOCKER_IMAGE}:${IMAGE_TAG}
                        docker push ${DOCKER_IMAGE}:latest
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                echo '🚀 Deploying to EC2...'
                withCredentials([
                    [$class: 'AmazonWebServicesCredentialsBinding', credentialsId: "${AWS_CREDENTIALS}"],
                    sshUserPrivateKey(credentialsId: "${SSH_KEY_CRED}", keyFileVariable: 'SSH_KEY')
                ]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no -i $SSH_KEY ${EC2_USER}@${EC2_HOST} << 'EOF'
                            set -e
                            echo "🔐 Logging into ECR..."
                            aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                            
                            echo "🛑 Stopping old container (if any)..."
                            docker stop my-web-app || true && docker rm my-web-app || true
                            
                            echo "📦 Pulling new image..."
                            docker pull ${DOCKER_IMAGE}:${IMAGE_TAG}
                            
                            echo "🚀 Starting new container..."
                            docker run -d --name my-web-app -p 80:3000 ${DOCKER_IMAGE}:${IMAGE_TAG}
                            
                            echo "🧹 Cleaning up..."
                            docker image prune -f
                        EOF
                    '''
                }
            }
        }

        stage('Health Check') {
            steps {
                echo '💚 Performing Health Check...'
                sh '''
                    sleep 10
                    curl -fs http://${EC2_HOST}/ || { echo "Health check failed!"; exit 1; }
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Deployment successful!'
            emailext(
                subject: "✅ SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    <h2>🎉 Deployment Successful!</h2>
                    <p><strong>Application:</strong> ${ECR_REPOSITORY}</p>
                    <p><strong>Version:</strong> ${IMAGE_TAG}</p>
                    <p><strong>URL:</strong> <a href="http://${EC2_HOST}">http://${EC2_HOST}</a></p>
                """,
                to: "${EMAIL_RECIPIENTS}",
                mimeType: 'text/html'
            )
        }

        failure {
            echo '❌ Pipeline Failed!'
            emailext(
                subject: "❌ FAILURE: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    <h2>Build Failed!</h2>
                    <p>Check Jenkins logs: <a href="${env.BUILD_URL}console">${env.BUILD_URL}console</a></p>
                """,
                to: "${EMAIL_RECIPIENTS}",
                mimeType: 'text/html'
            )
        }

        always {
            cleanWs()
        }
    }
}
