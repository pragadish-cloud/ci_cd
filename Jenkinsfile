pipeline {
    agent any
    
    environment {
        // AWS Configuration
        AWS_ACCOUNT_ID = '666098475707'
        AWS_REGION = 'us-east-1'
        ECR_REPOSITORY = 'my-web-app'
        
        // Docker Configuration
        DOCKER_IMAGE = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}"
        IMAGE_TAG = "${BUILD_NUMBER}"
        
        // Deployment Configuration
        EC2_HOST = 'ec2-44-201-137-203.compute-1.amazonaws.com'
        EC2_USER = 'ec2-user'
        
        // AWS Credentials (configured in Jenkins)
        AWS_CREDENTIALS = 'aws-credentials-id'
        
        // Email Configuration
        EMAIL_RECIPIENTS = 'your-email@example.com'
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo '==================== Checking out code from GitHub ===================='
                    checkout scm
                }
            }
        }
        
        stage('Build') {
            steps {
                script {
                    echo '==================== Building the Application ===================='
                    // For Node.js application
                    sh '''
                        npm install
                    '''
                    
                    // For Maven/Java application, use:
                    // sh 'mvn clean package'
                    
                    // For Python application, use:
                    // sh 'pip install -r requirements.txt'
                }
            }
        }
        
        stage('Test') {
            steps {
                script {
                    echo '==================== Running Tests ===================='
                    // For Node.js
                    sh 'npm test || true'
                    
                    // For Maven/Java, use:
                    // sh 'mvn test'
                    
                    // For Python, use:
                    // sh 'pytest tests/'
                }
            }
            post {
                always {
                    // Publish test results if they exist
                    script {
                        if (fileExists('**/test-results/*.xml')) {
                            junit '**/test-results/*.xml'
                        } else {
                            echo 'No test results found'
                        }
                    }
                }
            }
        }
        
        stage('Code Quality Analysis') {
            steps {
                script {
                    echo '==================== Running Code Quality Checks ===================='
                    // Example: ESLint for Node.js
                    sh 'npm run lint || true'
                    
                    // For SonarQube analysis (optional)
                    // sh 'sonar-scanner'
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo '==================== Building Docker Image ===================='
                    sh """
                        docker build -t ${ECR_REPOSITORY}:${IMAGE_TAG} .
                        docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${DOCKER_IMAGE}:${IMAGE_TAG}
                        docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${DOCKER_IMAGE}:latest
                    """
                }
            }
        }
        
        stage('Push to ECR') {
            steps {
                script {
                    echo '==================== Pushing Image to AWS ECR ===================='
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', 
                                    credentialsId: "${AWS_CREDENTIALS}"]]) {
                        sh """
                            # Login to ECR
                            aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                            
                            # Push images
                            docker push ${DOCKER_IMAGE}:${IMAGE_TAG}
                            docker push ${DOCKER_IMAGE}:latest
                        """
                    }
                }
            }
        }
        
        stage('Deploy to EC2') {
            steps {
                script {
                    echo '==================== Deploying to EC2 Instance ===================='
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', 
                                    credentialsId: "${AWS_CREDENTIALS}"],
                                   sshUserPrivateKey(credentialsId: 'ec2-ssh-key', 
                                                    keyFileVariable: 'SSH_KEY')]) {
                        sh """
                            # SSH into EC2 and deploy
                            ssh -o StrictHostKeyChecking=no -i \$SSH_KEY ${EC2_USER}@${EC2_HOST} << 'EOF'
                                # Login to ECR
                                aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                                
                                # Stop and remove old container
                                docker stop my-web-app || true
                                docker rm my-web-app || true
                                
                                # Pull and run new container
                                docker pull ${DOCKER_IMAGE}:${IMAGE_TAG}
                                docker run -d --name my-web-app -p 80:3000 ${DOCKER_IMAGE}:${IMAGE_TAG}
                                
                                # Clean up old images
                                docker image prune -f
EOF
                        """
                    }
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo '==================== Performing Health Check ===================='
                    sh """
                        sleep 10
                        curl -f http://${EC2_HOST}/ || exit 1
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo '==================== Pipeline Succeeded ===================='
            emailext (
                subject: "✅ Jenkins Pipeline Success: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                body: """
                    <h2>Build Success!</h2>
                    <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                    <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                    <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p><strong>Docker Image:</strong> ${DOCKER_IMAGE}:${IMAGE_TAG}</p>
                    <p><strong>Deployment URL:</strong> <a href="http://${EC2_HOST}">http://${EC2_HOST}</a></p>
                    <p>The application has been successfully deployed to AWS.</p>
                """,
                to: "${EMAIL_RECIPIENTS}",
                mimeType: 'text/html'
            )
        }
        
        failure {
            echo '==================== Pipeline Failed ===================='
            emailext (
                subject: "❌ Jenkins Pipeline Failed: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                body: """
                    <h2>Build Failed!</h2>
                    <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                    <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                    <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p><strong>Console Output:</strong> <a href="${env.BUILD_URL}console">${env.BUILD_URL}console</a></p>
                    <p>Please check the console output for details.</p>
                """,
                to: "${EMAIL_RECIPIENTS}",
                mimeType: 'text/html'
            )
        }
        
        always {
            // Clean up workspace
            cleanWs()
        }
    }
}


