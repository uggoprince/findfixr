# EC2 Deployment Guide

This guide will help you deploy the FindFixr application to Amazon EC2 using GitHub Actions.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **EC2 Instance** running Amazon Linux 2 or Ubuntu
3. **ECR Repository** created in AWS
4. **RDS Database** (PostgreSQL) or external database
5. **S3 Bucket** for file uploads (already configured in the app)

## AWS Setup

### 1. Create an ECR Repository

```bash
aws ecr create-repository --repository-name findfixr --region us-east-1
```

Note the repository URI (e.g., `123456789012.dkr.ecr.us-east-1.amazonaws.com/findfixr`)

### 2. Launch an EC2 Instance

- Choose Amazon Linux 2023 or Ubuntu 22.04 LTS
- Instance type: t2.micro or larger (t2.small recommended)
- Configure security group to allow:
  - SSH (port 22) from your IP
  - HTTP (port 80) from anywhere
  - HTTPS (port 443) from anywhere (optional)
- Create or select an existing key pair
- Ensure the instance has an IAM role with ECR pull permissions

### 3. Configure EC2 Instance

SSH into your EC2 instance and run:

```bash
# Update system
sudo yum update -y  # For Amazon Linux
# OR
sudo apt update && sudo apt upgrade -y  # For Ubuntu

# Install Docker
sudo yum install -y docker  # For Amazon Linux
# OR
sudo apt install -y docker.io  # For Ubuntu

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -a -G docker ec2-user  # For Amazon Linux
# OR
sudo usermod -a -G docker ubuntu  # For Ubuntu

# Install AWS CLI (if not already installed)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Logout and login again for group changes to take effect
```

### 4. Create IAM User for GitHub Actions

Create an IAM user with the following permissions:
- `AmazonEC2ContainerRegistryFullAccess`
- Or create a custom policy with ECR push/pull permissions

Save the Access Key ID and Secret Access Key.

## GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

### AWS Configuration
- `AWS_ACCESS_KEY_ID` - Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret access key
- `AWS_REGION` - Your AWS region (e.g., `us-east-1`)
- `ECR_REPOSITORY` - Your ECR repository name (e.g., `findfixr`)

### EC2 Configuration
- `EC2_HOST` - Your EC2 instance public IP or DNS
- `EC2_USER` - EC2 user (usually `ec2-user` for Amazon Linux or `ubuntu` for Ubuntu)
- `EC2_SSH_KEY` - Your EC2 private key (entire content of the .pem file)

### Application Configuration
- `DATABASE_URL` - PostgreSQL connection string (e.g., `postgresql://user:password@host:5432/database`)
- `JWT_SECRET` - Secret key for JWT token generation
- `AWS_S3_BUCKET` - S3 bucket name for file uploads
- `AWS_S3_REGION` - S3 bucket region

## Deployment

### Automatic Deployment

The deployment workflow automatically runs when you push to the `main` branch:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### Manual Deployment

You can also trigger deployment manually:

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select "Deploy to EC2" workflow
4. Click "Run workflow"
5. Select the branch and click "Run workflow"

## Workflow Overview

The GitHub Actions workflow does the following:

1. **Checkout Code** - Gets the latest code from the repository
2. **Configure AWS** - Sets up AWS credentials
3. **Login to ECR** - Authenticates with Amazon ECR
4. **Build & Push Docker Image** - Builds the Docker image and pushes it to ECR
5. **Deploy to EC2** - SSHs into EC2 and:
   - Pulls the latest image from ECR
   - Stops the old container
   - Starts a new container with updated environment variables
   - Runs database migrations
   - Cleans up old images

## Accessing Your Application

After successful deployment, your application will be available at:

```
http://<your-ec2-public-ip>
```

For GraphQL Playground (if enabled):
```
http://<your-ec2-public-ip>/graphql
```

## Monitoring and Troubleshooting

### View Container Logs

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ec2-user@<ec2-public-ip>

# View logs
docker logs findfixr-app

# Follow logs in real-time
docker logs -f findfixr-app
```

### Check Container Status

```bash
docker ps -a
```

### Restart Container

```bash
docker restart findfixr-app
```

### Access Container Shell

```bash
docker exec -it findfixr-app sh
```

## Database Migrations

Migrations run automatically during deployment. To run manually:

```bash
docker exec findfixr-app npx prisma migrate deploy
```

## Security Considerations

1. **Never commit secrets** - Always use GitHub Secrets
2. **Restrict EC2 security groups** - Only allow necessary ports
3. **Use HTTPS** - Set up SSL/TLS with Let's Encrypt or AWS Certificate Manager
4. **Regular updates** - Keep your EC2 instance and Docker images updated
5. **IAM roles** - Use EC2 IAM roles instead of embedding AWS credentials when possible

## Optional: Set Up SSL/TLS

To enable HTTPS, consider:

1. Using AWS Application Load Balancer with SSL certificate
2. Installing Nginx as reverse proxy with Let's Encrypt
3. Using AWS CloudFront as CDN with SSL

## Cost Optimization

- Use t3.micro or t2.micro for small workloads (free tier eligible)
- Set up auto-stop for non-production environments
- Use ECR lifecycle policies to clean up old images
- Monitor AWS costs in the billing dashboard

## Support

For issues or questions:
- Check GitHub Actions logs
- Review EC2 instance logs
- Verify all secrets are correctly set
- Ensure security groups allow necessary traffic
