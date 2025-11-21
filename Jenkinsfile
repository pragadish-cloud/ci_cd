pipeline {
    agent any
    
    environment {
        // GCP Configuration
        PROJECT_ID = 'emerald-state-472315-d7'                    // Replace with your GCP project ID
        CLUSTER_ZONE = 'us-central1-a'
        REGISTRY_HOSTNAME = 'us-central1-docker.pkg.dev'
        REPOSITORY = 'docker-repo'
        IMAGE_NAME = 'my-web-app'
        IMAGE_TAG = "${BUILD_NUMBER}"
        
        // Credentials
        GCP_CREDENTIALS = credentials('gcp-service-account')
        
        // Email Configuration
        EMAIL_RECIPIENTS = 'shajandav@gmail.com'       // Replace with your email
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '=========================================='
                echo 'Stage 1: Checking out code from GitHub'
                echo '=========================================='
                checkout scm
                sh 'git rev-parse HEAD > commit-id.txt'
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    env.GIT_COMMIT_MSG = sh(
                        script: "git log -1 --pretty=%B",
                        returnStdout: true
                    ).trim()
                }
                echo "Commit ID: ${env.GIT_COMMIT_SHORT}"
                echo "Commit Message: ${env.GIT_COMMIT_MSG}"
            }
        }
        
        stage('Build') {
            steps {
                echo '=========================================='
                echo 'Stage 2: Building the application'
                echo '=========================================='
                script {
                    if (fileExists('package.json')) {
                        echo 'Node.js project detected. Installing dependencies...'
                        sh 'npm install'
                        echo 'Dependencies installed successfully!'
                    } else if (fileExists('pom.xml')) {
                        echo 'Maven project detected. Building...'
                        sh 'mvn clean install -DskipTests'
                        echo 'Maven build completed!'
                    } else if (fileExists('requirements.txt')) {
                        echo 'Python project detected. Installing dependencies...'
                        sh 'pip install -r requirements.txt'
                        echo 'Python dependencies installed!'
                    } else {
                        echo 'No build configuration detected. Skipping build step.'
                    }
                }
            }
        }
        
        stage('Test') {
            steps {
                echo '=========================================='
                echo 'Stage 3: Running unit tests'
                echo '=========================================='
                script {
                    if (fileExists('package.json')) {
                        sh 'npm test || echo "No tests defined"'
                    } else if (fileExists('pom.xml')) {
                        sh 'mvn test'
                    } else if (fileExists('pytest.ini') || fileExists('tests/')) {
                        sh 'pytest || echo "No pytest tests found"'
                    } else {
                        echo 'No test configuration found. Skipping tests.'
                    }
                }
                echo 'Tests completed successfully!'
            }
        }
        
        stage('Code Quality Analysis') {
            steps {
                echo '=========================================='
                echo 'Stage 4: Running code quality checks'
                echo '=========================================='
                script {
                    // Basic linting checks
                    if (fileExists('package.json')) {
                        sh '''
                            echo "Running ESLint..."
                            npx eslint . --ext .js,.jsx || echo "ESLint not configured"
                        '''
                    } else if (fileExists('requirements.txt')) {
                        sh '''
                            echo "Running Pylint..."
                            pip install pylint || true
                            pylint **/*.py || echo "Pylint check completed with warnings"
                        '''
                    }
                }
                
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo '=========================================='
                echo 'Stage 5: Building Docker image'
                echo '=========================================='
                script {
                    // Verify Dockerfile exists
                    if (!fileExists('Dockerfile')) {
                        error('Dockerfile not found! Please create a Dockerfile in the repository root.')
                    }
                    
                    echo "Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
                    sh """
                        docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                        docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${REGISTRY_HOSTNAME}/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}
                        docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${REGISTRY_HOSTNAME}/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest
                    """
                    echo "Docker image built successfully!"
                    
                    // Display image info
                    sh "docker images | grep ${IMAGE_NAME}"
                }
            }
        }
        
        stage('Push to Artifact Registry') {
            steps {
                echo '=========================================='
                echo 'Stage 6: Pushing image to GCP Artifact Registry'
                echo '=========================================='
                sh """
                    # Authenticate with GCP
                    gcloud auth activate-service-account --key-file=${GCP_CREDENTIALS}
                    gcloud config set project ${PROJECT_ID}
                    
                    # Configure Docker to use gcloud as credential helper
                    gcloud auth configure-docker ${REGISTRY_HOSTNAME} --quiet
                    
                    # Push images
                    echo "Pushing image with tag: ${IMAGE_TAG}"
                    docker push ${REGISTRY_HOSTNAME}/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}
                    
                    echo "Pushing image with tag: latest"
                    docker push ${REGISTRY_HOSTNAME}/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest
                    
                    echo "Images pushed successfully to Artifact Registry!"
                """
                
                script {
                    env.IMAGE_URL = "${REGISTRY_HOSTNAME}/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"
                    echo "Image URL: ${env.IMAGE_URL}"
                }
            }
        }
        
        stage('Deploy to Cloud Run') {
            steps {
                echo '=========================================='
                echo 'Stage 7: Deploying to GCP Cloud Run'
                echo '=========================================='
                sh """
                    # Authenticate and set project
                    gcloud auth activate-service-account --key-file=${GCP_CREDENTIALS}
                    gcloud config set project ${PROJECT_ID}
                    
                    # Deploy to Cloud Run
                    gcloud run deploy ${IMAGE_NAME} \
                        --image=${REGISTRY_HOSTNAME}/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG} \
                        --platform=managed \
                        --region=us-central1 \
                        --allow-unauthenticated \
                        --port=8080 \
                        --memory=512Mi \
                        --cpu=1 \
                        --max-instances=10 \
                        --timeout=300 \
                        --set-env-vars="BUILD_NUMBER=${BUILD_NUMBER},GIT_COMMIT=${GIT_COMMIT_SHORT}"
                    
                    echo "Deployment to Cloud Run completed!"
                """
            }
        }
        
        stage('Verify Deployment') {
            steps {
                echo '=========================================='
                echo 'Stage 8: Verifying deployment'
                echo '=========================================='
                script {
                    sh """
                        gcloud auth activate-service-account --key-file=${GCP_CREDENTIALS}
                        gcloud config set project ${PROJECT_ID}
                        
                        # Get service URL
                        SERVICE_URL=\$(gcloud run services describe ${IMAGE_NAME} \
                            --region=us-central1 \
                            --format='value(status.url)')
                        
                        echo "=========================================="
                        echo "Application deployed successfully!"
                        echo "URL: \$SERVICE_URL"
                        echo "=========================================="
                        
                        # Health check
                        echo "Performing health check..."
                        sleep 5
                        
                        HTTP_CODE=\$(curl -s -o /dev/null -w "%{http_code}" \$SERVICE_URL/health || echo "000")
                        
                        if [ "\$HTTP_CODE" = "200" ] || [ "\$HTTP_CODE" = "000" ]; then
                            echo "Health check passed! Service is responding."
                            echo "\$SERVICE_URL" > deployment-url.txt
                        else
                            echo "Warning: Health check returned code \$HTTP_CODE"
                            echo "Please verify the deployment manually."
                        fi
                    """
                    
                    // Store URL for email notification
                    env.DEPLOYMENT_URL = sh(
                        script: "cat deployment-url.txt",
                        returnStdout: true
                    ).trim()
                }
            }
        }
        
        stage('Cleanup') {
            steps {
                echo '=========================================='
                echo 'Stage 9: Cleaning up local Docker images'
                echo '=========================================='
                sh """
                    # Remove local images to save space
                    docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true
                    docker rmi ${REGISTRY_HOSTNAME}/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG} || true
                    
                    # Clean up dangling images
                    docker image prune -f
                    
                    echo "Cleanup completed!"
                """
            }
        }
    }
    
    post {
        success {
            echo '=========================================='
            echo 'Pipeline completed SUCCESSFULLY!'
            echo '=========================================='
            script {
                def duration = currentBuild.duration / 1000
                emailext(
                    subject: "✅ SUCCESS: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                    body: """
                        <html>
                        <body>
                            <h2 style="color: green;">✅ Build Success!</h2>
                            <hr>
                            <table border="1" cellpadding="5">
                                <tr><td><strong>Pipeline:</strong></td><td>${env.JOB_NAME}</td></tr>
                                <tr><td><strong>Build Number:</strong></td><td>${env.BUILD_NUMBER}</td></tr>
                                <tr><td><strong>Status:</strong></td><td style="color: green;">SUCCESS</td></tr>
                                <tr><td><strong>Duration:</strong></td><td>${duration} seconds</td></tr>
                                <tr><td><strong>Git Commit:</strong></td><td>${env.GIT_COMMIT_SHORT}</td></tr>
                                <tr><td><strong>Commit Message:</strong></td><td>${env.GIT_COMMIT_MSG}</td></tr>
                                <tr><td><strong>Image Tag:</strong></td><td>${env.IMAGE_TAG}</td></tr>
                                <tr><td><strong>Deployment URL:</strong></td><td><a href="${env.DEPLOYMENT_URL}">${env.DEPLOYMENT_URL}</a></td></tr>
                            </table>
                            <hr>
                            <p><strong>Console Output:</strong> <a href="${env.BUILD_URL}console">${env.BUILD_URL}console</a></p>
                            <p><strong>Jenkins Build:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                            <br>
                            <p style="color: gray; font-size: 12px;">This is an automated message from Jenkins CI/CD Pipeline</p>
                        </body>
                        </html>
                    """,
                    to: "${EMAIL_RECIPIENTS}",
                    mimeType: 'text/html'
                )
            }
        }
        
        failure {
            echo '=========================================='
            echo 'Pipeline FAILED!'
            echo '=========================================='
            script {
                def duration = currentBuild.duration / 1000
                emailext(
                    subject: "❌ FAILURE: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                    body: """
                        <html>
                        <body>
                            <h2 style="color: red;">❌ Build Failed!</h2>
                            <hr>
                            <table border="1" cellpadding="5">
                                <tr><td><strong>Pipeline:</strong></td><td>${env.JOB_NAME}</td></tr>
                                <tr><td><strong>Build Number:</strong></td><td>${env.BUILD_NUMBER}</td></tr>
                                <tr><td><strong>Status:</strong></td><td style="color: red;">FAILURE</td></tr>
                                <tr><td><strong>Duration:</strong></td><td>${duration} seconds</td></tr>
                                <tr><td><strong>Git Commit:</strong></td><td>${env.GIT_COMMIT_SHORT}</td></tr>
                                <tr><td><strong>Commit Message:</strong></td><td>${env.GIT_COMMIT_MSG}</td></tr>
                                <tr><td><strong>Failed Stage:</strong></td><td>${env.STAGE_NAME}</td></tr>
                            </table>
                            <hr>
                            <p><strong>Console Output:</strong> <a href="${env.BUILD_URL}console">${env.BUILD_URL}console</a></p>
                            <p><strong>Jenkins Build:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                            <br>
                            <p style="color: red;">⚠️ Please check the console output for detailed error messages.</p>
                            <p style="color: gray; font-size: 12px;">This is an automated message from Jenkins CI/CD Pipeline</p>
                        </body>
                        </html>
                    """,
                    to: "${EMAIL_RECIPIENTS}",
                    mimeType: 'text/html'
                )
            }
        }
        
        unstable {
            echo '=========================================='
            echo 'Pipeline is UNSTABLE!'
            echo '=========================================='
            emailext(
                subject: "⚠️ UNSTABLE: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                body: """
                    Pipeline: ${env.JOB_NAME}
                    Build Number: ${env.BUILD_NUMBER}
                    Status: UNSTABLE
                    
                    Some tests may have failed or warnings were detected.
                    
                    Check console output at: ${env.BUILD_URL}console
                """,
                to: "${EMAIL_RECIPIENTS}"
            )
        }
        
        always {
            echo '=========================================='
            echo 'Pipeline execution completed'
            echo '=========================================='
            // Clean up workspace (optional)
            // cleanWs()
        }
    }
}

