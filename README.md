# ☕ Aurora Morning Brew — Cloud-Ready Coffee Ordering Web App

> **A warm, dawn-inspired artisanal coffee web application.**
> Features user authentication (register/login with password hashing), a dynamic morning coffee & bakery menu, basket calculations, and an order management workflow.
> Built with **Python (Flask)**, designed to run locally, on **Docker**, **AWS EC2**, **AWS RDS**, and **AWS EKS** with **AWS Secrets Manager** password management.

---

## ⏱️ 3-Hour Execution Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HOUR 1: Local Setup & VS Code Integration (00:00 - 00:45)                   │
│   • Open folder in VS Code & activate terminal                              │
│   • Create virtualenv & install dependencies                                │
│   • Run Flask app & test Auth + Coffee Ordering in browser                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ HOUR 2: Git, GitHub Push & Docker Container (00:45 - 01:30)                 │
│   • Stage & commit changes in Git                                           │
│   • Create repository on GitHub & push from VS Code                         │
│   • Build & test Docker container locally                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ HOUR 3: AWS Cloud Deployment & AWS Secrets Manager (01:30 - 03:00)          │
│   • Provision AWS RDS PostgreSQL (or EC2 DB)                                │
│   • Store DB credentials safely in AWS Secrets Manager                      │
│   • Launch AWS EC2 instance, clone GitHub repo / pull Docker image           │
│   • Run app on EC2 & connect EKS manifests (Optional Kubernetes step)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
morning-brew-coffee/
├── app.py                # Main Flask app (Auth endpoints, Menu API, Orders)
├── models.py             # SQLAlchemy models (User, MenuItem, Order, OrderItem)
├── config.py             # Configuration (loads DB URL or AWS Secrets Manager)
├── aws_secrets.py        # Boto3 client helper for AWS Secrets Manager
├── requirements.txt      # Python dependencies (Flask, SQLAlchemy, Boto3, etc.)
├── Dockerfile            # Production Docker image with Python 3.11-slim
├── docker-compose.yml    # One-click local stack (App + PostgreSQL)
├── .env.example          # Environment variable template
├── .gitignore            # Git ignore rules for Python, DBs, and keys
├── templates/
│   └── index.html        # Morning sunrise single-page interface
├── static/
│   ├── css/
│   │   └── style.css     # Cozy morning dawn theme (Golds, Creams, Espressos)
│   └── js/
│       └── app.js        # Auth state, cart drawer, modals & notifications
└── k8s/
    ├── deployment.yaml   # Kubernetes EKS Deployment with health probes
    └── service.yaml      # Kubernetes LoadBalancer service
```

---

## 🚀 HOUR 1: Local Setup & VS Code Integration

### Step 1: Open the Project in VS Code
Open your terminal (PowerShell or Bash) and run:
```powershell
cd C:\Users\DELL\.gemini\antigravity\scratch\morning-brew-coffee
code .
```
*(VS Code will open with all project files ready in the explorer).*

### Step 2: Create and Activate Python Virtual Environment
In the VS Code integrated terminal (`Ctrl + ~`):
```powershell
# Create virtual environment
python -m venv venv

# Activate it (Windows PowerShell)
.\venv\Scripts\Activate.ps1
# (If execution policy error occurs, run: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)

# Or on Mac/Linux:
# source venv/bin/activate
```

### Step 3: Install Requirements
```powershell
pip install -r requirements.txt
```

### Step 4: Run the Web App
```powershell
python app.py
```
Open your browser to: **`http://localhost:5000`**

- **Try signing up**: Click **"Sign In"** -> **"Create Account"**, enter username, email, and password.
- **Select coffees**: Add the *Sunrise Caramel Macchiato* or *First Light Cold Brew* to your basket.
- **Checkout**: Click the **Basket** icon, add a morning note, and place the order.
- **View Orders**: Click **"Orders"** to see live status updates.

*(By default, the app initializes a lightweight SQLite database `coffee_shop.db` with sample morning items automatically!)*

---

## 🐙 HOUR 2: Push to GitHub & Dockerize

### Step 1: Commit Your Code
Inside VS Code terminal:
```powershell
git add .
git commit -m "feat: complete Aurora Morning Brew coffee web app with auth and ordering"
git branch -M main
```

### Step 2: Push to GitHub
1. Go to [GitHub.com](https://github.com) and click **"New Repository"**.
2. Name it `morning-brew-coffee` and leave it empty (no README/license since you already have them).
3. Connect your local repository and push:
```powershell
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/morning-brew-coffee.git
git push -u origin main
```

### Step 3: Test with Docker (Local)
Ensure Docker Desktop is running, then run either:

**Option A — Standalone Docker Container:**
```powershell
docker build -t morning-brew-coffee .
docker run -p 5000:5000 -e SECRET_KEY="my-secret-key" morning-brew-coffee
```

**Option B — Full Stack with PostgreSQL (mimics AWS RDS):**
```powershell
docker compose up --build
```
Access at `http://localhost:5000`.

---

## ☁️ HOUR 3: AWS Cloud Deployment (EC2, RDS & Secrets Manager)

### Step 1: Create Database in AWS RDS (PostgreSQL)
1. Go to **AWS Console** -> **RDS** -> **Create Database**.
2. Select **PostgreSQL** (Free tier template).
3. Set:
   - DB instance identifier: `morning-brew-db`
   - Master username: `coffee_admin`
   - Master password: `YourStrongPassword2026!`
   - Public access: Yes (or keep within your VPC for EC2 access).
4. Once active, note the **Endpoint** (e.g. `morning-brew-db.c1234.us-east-1.rds.amazonaws.com`).

---

### Step 2: Store Database Password in AWS Secrets Manager
To avoid hardcoding passwords in code or `.env`:
1. In **AWS Console**, navigate to **AWS Secrets Manager** -> **Store a new secret**.
2. Secret type: **Credentials for Amazon RDS database** (or **Other type of secret**).
3. Enter key-value pairs:
   ```json
   {
     "username": "coffee_admin",
     "password": "YourStrongPassword2026!",
     "host": "morning-brew-db.c1234.us-east-1.rds.amazonaws.com",
     "port": 5432,
     "dbname": "coffee_db"
   }
   ```
4. Name the secret: `aurora/morning-brew/db-credentials`.
5. The application's `aws_secrets.py` and `config.py` are pre-coded to automatically read this secret when `AWS_SECRET_NAME=aurora/morning-brew/db-credentials` is set!

---

### Step 3: Launch and Configure AWS EC2
1. Go to **AWS EC2 Console** -> **Launch Instance**.
2. Choose **Amazon Linux 2023** or **Ubuntu 22.04 LTS** (t2.micro / t3.micro).
3. In **Security Group**, allow inbound rules:
   - **SSH (Port 22)** from your IP
   - **HTTP (Port 80)** from Anywhere
   - **Custom TCP (Port 5000)** from Anywhere
4. Under **Advanced details** -> **IAM instance profile**: Attach an IAM Role with `SecretsManagerReadWrite` policy so the EC2 instance can read your secret without storing raw API keys.
5. SSH into your EC2 instance:
   ```bash
   ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
   ```

### Step 4: Run Application on EC2
Inside the EC2 SSH terminal:
```bash
# 1. Update system & install Git + Docker
sudo apt update -y
sudo apt install -y git docker.io
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# Log out and log back in for docker group to apply, then:
git clone https://github.com/<YOUR_GITHUB_USERNAME>/morning-brew-coffee.git
cd morning-brew-coffee

# 2. Set environment variables
export AWS_SECRET_NAME="aurora/morning-brew/db-credentials"
export AWS_REGION="us-east-1"
export SECRET_KEY="prod-sunrise-session-secret"

# 3. Build & Run Docker container on EC2 port 80
docker build -t morning-brew .
docker run -d -p 80:5000 \
  -e AWS_SECRET_NAME="aurora/morning-brew/db-credentials" \
  -e AWS_REGION="us-east-1" \
  -e SECRET_KEY="prod-sunrise-session-secret" \
  --name morning-brew-container \
  --restart always \
  morning-brew
```
Now visit **`http://<YOUR_EC2_PUBLIC_IP>`** in your browser!

---

## ☸️ EKS / Kubernetes Deployment (Optional Production Step)

If deploying to an **AWS EKS** cluster with Docker images pushed to Amazon ECR or Docker Hub:

```bash
# 1. Update the image in k8s/deployment.yaml with your ECR/DockerHub tag
# 2. Apply manifests to EKS
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# 3. Get the AWS Load Balancer URL
kubectl get services morning-brew-service -w
```

### AWS Secrets Manager on EKS:
On EKS, use the **AWS Secrets and Configuration Provider (ASCP)** for the **Kubernetes Secrets Store CSI Driver**. It mounts secrets stored in AWS Secrets Manager directly into your pod as environment variables or secret volumes via IAM Roles for Service Accounts (IRSA).

---

## 🎨 Design Highlights
- **Morning Sunrise Color Palette**: Dawn amber (`#f59e0b`), golden roasted honey (`#d97706`), creamy morning linen (`#fdfbf7`), and rich espresso (`#261611`).
- **Tactile Barista Elements**: Steam animation rising from the artisanal roast card, real-time basket calculations, and customizable pickup notes.
- **Robust Security**: Passwords hashed with PBKDF2/SHA-256 via Werkzeug, protected session cookies, and zero hardcoded secrets.
