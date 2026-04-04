# Multi-Cloud Deployment Architecture & Implementation Plan

> **Date:** 2026-04-04
> **Scope:** CogniSys BA — Kubernetes-based multi-cloud deployment with Firebase primary and fallback providers
> **Audience:** Engineering team

---

## 1. Current State Assessment

### 1.1 Cloud Dependencies

| Component | Current Implementation | Cloud Lock-in | Portability |
|---|---|---|---|
| **Database** | Firestore | **HIGH** — GCP-only service | None without abstraction |
| **Auth** | Firebase Auth | **HIGH** — GCP-only service | None without abstraction |
| **Vector Store** | Firestore vectors | **HIGH** — GCP-only | None without abstraction |
| **Object Storage** | Firebase Storage (implied) | **MEDIUM** — GCP-specific API | Low |
| **Runtime** | Docker (Node 20 Alpine) | **LOW** — portable container | Runs anywhere |
| **Build** | Cloud Build (`cloudbuild.yaml`) | **MEDIUM** — GCP CI/CD | Replaceable |
| **Secrets** | Firebase Admin SDK config | **MEDIUM** — tied to Firebase | Replaceable |
| **Logging** | Pino (structured) | **LOW** — application-level | Portable |
| **Tracing** | OpenTelemetry | **LOW** — vendor-neutral | Portable |

### 1.2 Existing Infrastructure Files

| File | Purpose | Multi-Cloud Ready? |
|---|---|---|
| `Dockerfile` | Multi-stage build, non-root user, health check | **YES** — already portable |
| `docker-compose.yml` | Local development orchestration | **PARTIAL** — needs cloud service overrides |
| `cloudbuild.yaml` | GCP Cloud Build pipeline | **NO** — GCP-locked |
| `firebase-applet-config.json` | Firebase client config | **NO** — GCP-locked |
| `firebase.ts` | Firebase Admin SDK setup | **NO** — GCP-locked |

---

## 2. Target Architecture

### 2.1 Design Principles

1. **Firebase primary, not exclusive** — Firestore and Firebase Auth remain the default, but the code can switch to alternative providers via configuration
2. **Abstraction over duplication** — repository and provider patterns with interfaces, not copy-pasted implementations
3. **Runtime provider selection** — environment variables determine which provider is active; zero code changes to switch clouds
4. **Kubernetes as the universal runtime** — Helm charts deploy identically to EKS, GKE, and AKS
5. **Terraform for infrastructure** — cloud-agnostic IaC with provider-specific modules
6. **GitHub Actions for CI/CD** — cloud-agnostic pipeline with per-cloud deploy jobs

### 2.2 High-Level Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │         Cloudflare / Global DNS               │
                    │   Traffic Routing │ WAF │ Load Balancing     │
                    └──────────┬───────────────────┬───────────────┘
                               │                   │
              ┌────────────────▼────────┐  ┌───────▼───────────────────┐
              │   GCP (Primary)          │  │  AWS / Azure (Fallback)   │
              │                          │  │                           │
              │  ┌────────────────────┐  │  │  ┌─────────────────────┐  │
              │  │  GKE Cluster       │  │  │  │  EKS / AKS Cluster  │  │
              │  │  ┌──────────────┐  │  │  │  │  ┌───────────────┐  │  │
              │  │  │ CogniSys Pod │  │  │  │  │  │ CogniSys Pod  │  │  │
              │  │  │ Express 5    │  │  │  │  │  │ Express 5     │  │  │
              │  │  │ :8080        │  │  │  │  │  │ :8080         │  │  │
              │  │  └──────┬───────┘  │  │  │  │  └──────┬────────┘  │  │
              │  │         │          │  │  │  │         │           │  │
              │  │  ┌──────▼───────┐  │  │  │  │  ┌──────▼────────┐  │  │
              │  │  │  Firestore   │  │  │  │  │  │  DynamoDB /   │  │  │
              │  │  │  (Primary)   │  │  │  │  │  │  CosmosDB     │  │  │
              │  │  └──────────────┘  │  │  │  │  │  (Fallback)   │  │  │
              │  │                    │  │  │  │  └───────────────┘  │  │
              │  │  ┌──────────────┐  │  │  │  │                     │  │
              │  │  │ Firebase Auth│  │  │  │  │  ┌───────────────┐  │  │
              │  │  │ (Primary)    │  │  │  │  │  │ Cognito /     │  │  │
              │  │  └──────────────┘  │  │  │  │  │ Entra ID      │  │  │
              │  │                    │  │  │  │  │ (Fallback)    │  │  │
              │  │  ┌──────────────┐  │  │  │  │  └───────────────┘  │  │
              │  │  │ GCS / FB     │  │  │  │  │                     │  │
              │  │  │ Storage      │  │  │  │  │  ┌───────────────┐  │  │
              │  │  │ (Primary)    │  │  │  │  │  │ S3 / Blob     │  │  │
              │  │  └──────────────┘  │  │  │  │  │ Storage       │  │  │
              │  │                    │  │  │  │  │ (Fallback)    │  │  │
              │  └────────────────────┘  │  │  │  └───────────────┘  │  │
              │                          │  │  │                     │  │
              └──────────────────────────┘  └────────────────────────┘
```

### 2.3 Provider Selection Matrix

| Layer | Primary (GCP) | Fallback (AWS) | Fallback (Azure) | Cloud-Agnostic |
|---|---|---|---|---|
| **Database** | Firestore | DynamoDB | Cosmos DB | PostgreSQL |
| **Auth** | Firebase Auth | Cognito | Entra ID | Auth0 |
| **Object Storage** | GCS / Firebase Storage | S3 | Blob Storage | — |
| **Container Runtime** | GKE | EKS | AKS | — |
| **Secrets** | Secret Manager | Secrets Manager | Key Vault | — |
| **DNS / CDN** | Cloud DNS + Cloud CDN | Route 53 + CloudFront | Azure DNS + CDN | Cloudflare |
| **CI/CD** | Cloud Build | CodePipeline | Azure DevOps | GitHub Actions |

---

## 3. Abstraction Layer Design

### 3.1 Repository Pattern (Database Abstraction)

**Directory structure:**
```
server/repositories/
├── interface.ts              # IRepository<T> — cloud-agnostic interface
├── firestore.ts              # Firestore implementation (current code, extracted)
├── dynamodb.ts               # AWS DynamoDB implementation
├── cosmosdb.ts               # Azure Cosmos DB implementation
├── postgres.ts               # PostgreSQL implementation (portable fallback)
└── factory.ts                # RepositoryFactory — selects provider at runtime
```

**Interface definition:**
```typescript
interface QueryFilter {
  field: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'array-contains';
  value: any;
}

interface IRepository<T extends { id: string }> {
  get(id: string): Promise<T | null>;
  getAll(filter?: QueryFilter[]): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  batchWrite(items: (T | Omit<T, 'id'>)[]): Promise<void>;
  query(filter: QueryFilter[]): Promise<T[]>;
  transaction<T>(fn: (repo: IRepository<T>) => Promise<T>): Promise<T>;
}
```

**Factory pattern:**
```typescript
class RepositoryFactory {
  static create<T extends { id: string }>(
    collection: string,
    provider?: string
  ): IRepository<T> {
    const dbProvider = provider ?? process.env.DB_PROVIDER ?? 'firestore';
    switch (dbProvider) {
      case 'firestore':  return new FirestoreRepository<T>(collection);
      case 'dynamodb':   return new DynamoDBRepository<T>(collection);
      case 'cosmosdb':   return new CosmosDBRepository<T>(collection);
      case 'postgres':   return new PostgresRepository<T>(collection);
      default:           throw new Error(`Unknown DB provider: ${dbProvider}`);
    }
  }
}
```

**Existing repositories to extract:**
- `server/repositories/` (currently Firestore-specific — need to implement interface)
- Organization repository
- Project repository
- Initiative repository
- Billing repository
- Usage repository

### 3.2 Auth Provider Abstraction

**Directory structure:**
```
server/services/auth/
├── interface.ts              # IAuthProvider
├── firebase.ts               # Firebase Auth (current code, extracted)
├── cognito.ts                # AWS Cognito
├── entra-id.ts               # Azure Entra ID
├── auth0.ts                  # Auth0 (cloud-agnostic option)
└── factory.ts                # AuthFactory
```

**Interface definition:**
```typescript
interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  customClaims: Record<string, any>;
}

interface IAuthProvider {
  verifyToken(token: string): Promise<AuthUser>;
  getUser(uid: string): Promise<AuthUser | null>;
  setCustomClaims(uid: string, claims: Record<string, any>): Promise<void>;
  createUser(email: string, password: string): Promise<AuthUser>;
  deleteUser(uid: string): Promise<void>;
  listUsers(maxResults?: number): Promise<AuthUser[]>;
}
```

### 3.3 Storage Provider Abstraction

**Directory structure:**
```
server/services/storage/
├── interface.ts              # IStorageProvider
├── gcs.ts                    # Google Cloud Storage / Firebase Storage
├── s3.ts                     # AWS S3
├── azure-blob.ts             # Azure Blob Storage
└── factory.ts                # StorageFactory
```

**Interface definition:**
```typescript
interface StorageObject {
  key: string;
  url: string;
  contentType: string;
  size: number;
  updatedAt: string;
}

interface IStorageProvider {
  upload(file: Buffer, key: string, contentType?: string): Promise<StorageObject>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getUrl(key: string, expiresIn?: number): Promise<string>;
  list(prefix: string): Promise<StorageObject[]>;
}
```

### 3.4 Vector Store Abstraction (for AI embeddings)

**Directory structure:**
```
server/services/vector/
├── interface.ts              # IVectorStore
├── firestore.ts              # Firestore vectors (current)
├── pinecone.ts               # Pinecone (cloud-agnostic)
├── qdrant.ts                 # Qdrant (self-hosted or cloud)
└── factory.ts                # VectorFactory
```

**Interface definition:**
```typescript
interface IVectorStore {
  upsert(id: string, vector: number[], metadata: Record<string, any>): Promise<void>;
  query(vector: number[], topK: number, filter?: Record<string, any>): Promise<VectorResult[]>;
  delete(id: string): Promise<void>;
  deleteByFilter(filter: Record<string, any>): Promise<number>;
}

interface VectorResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
}
```

---

## 4. Kubernetes Deployment

### 4.1 Helm Chart Structure

```
helm/cognisys/
├── Chart.yaml
├── values.yaml               # Default values (GCP/Firebase)
├── values-aws.yaml           # AWS overrides
├── values-azure.yaml         # Azure overrides
├── templates/
│   ├── _helpers.tpl
│   ├── deployment.yaml       # CogniSys Express deployment
│   ├── service.yaml          # ClusterIP service
│   ├── ingress.yaml          # Ingress with TLS
│   ├── hpa.yaml              # Horizontal Pod Autoscaler
│   ├── configmap.yaml        # Environment variables
│   ├── secret.yaml           # Sensitive values (referenced, not stored)
│   ├── serviceaccount.yaml   # IAM workload identity
│   ├── pdb.yaml              # Pod Disruption Budget
│   └── tests/
│       └── test-connection.yaml
```

### 4.2 Key Helm Values

**`values.yaml` (GCP defaults):**
```yaml
replicaCount: 2

image:
  repository: cognisys/api
  tag: latest
  pullPolicy: IfNotPresent

cloudProvider: gcp

config:
  DB_PROVIDER: firestore
  AUTH_PROVIDER: firebase
  STORAGE_PROVIDER: gcs
  VECTOR_PROVIDER: firestore
  NODE_ENV: production
  PORT: 8080

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 250m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: api.cognisys.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: cognisys-tls
      hosts:
        - api.cognisys.example.com
```

**`values-aws.yaml`:**
```yaml
cloudProvider: aws

config:
  DB_PROVIDER: dynamodb
  AUTH_PROVIDER: cognito
  STORAGE_PROVIDER: s3
  VECTOR_PROVIDER: pinecone

serviceAccount:
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT:role/cognisys-oidc
```

**`values-azure.yaml`:**
```yaml
cloudProvider: azure

config:
  DB_PROVIDER: cosmosdb
  AUTH_PROVIDER: entra-id
  STORAGE_PROVIDER: azure-blob
  VECTOR_PROVIDER: qdrant

serviceAccount:
  annotations:
    azure.workload.identity/client-id: CLIENT_ID
```

### 4.3 Deployment Manifests

**`templates/deployment.yaml`:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "cognisys.fullname" . }}
  labels:
    {{- include "cognisys.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "cognisys.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "cognisys.selectorLabels" . | nindent 8 }}
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
    spec:
      serviceAccountName: {{ include "cognisys.fullname" . }}
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
        - name: cognisys
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.config.PORT }}
              protocol: TCP
          envFrom:
            - configMapRef:
                name: {{ include "cognisys.fullname" . }}-config
          env:
            {{- range $key, $value := .Values.secrets }}
            - name: {{ $key }}
              valueFrom:
                secretKeyRef:
                  name: {{ include "cognisys.fullname" $ }}-secrets
                  key: {{ $key }}
            {{- end }}
          livenessProbe:
            httpGet:
              path: /api/health
              port: http
            initialDelaySeconds: 10
            periodSeconds: 30
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /api/health
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
```

### 4.4 Pod Disruption Budget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "cognisys.fullname" . }}
spec:
  minAvailable: 1
  selector:
    matchLabels:
      {{- include "cognisys.selectorLabels" . | nindent 6 }}
```

### 4.5 Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "cognisys.fullname" . }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "cognisys.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
```

---

## 5. Infrastructure as Code (Terraform)

### 5.1 Directory Structure

```
infra/
├── main.tf                   # Root module — provider selection
├── variables.tf              # Global input variables
├── outputs.tf                # Global outputs
├── providers.tf              # Provider configurations
├── backend.tf                # Remote state backend
├── modules/
│   ├── gcp/
│   │   ├── main.tf           # GKE, Cloud SQL, Secret Manager, IAM
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── gke.tf            # GKE cluster
│   │   ├── networking.tf     # VPC, subnets, NAT
│   │   └── iam.tf            # Workload Identity
│   ├── aws/
│   │   ├── main.tf           # EKS, RDS, Secrets Manager, IAM
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── eks.tf            # EKS cluster
│   │   ├── networking.tf     # VPC, subnets, NAT
│   │   └── iam.tf            # OIDC provider, roles
│   └── azure/
│       ├── main.tf           # AKS, Cosmos DB, Key Vault, Managed Identity
│       ├── variables.tf
│       ├── outputs.tf
│       ├── aks.tf            # AKS cluster
│       ├── networking.tf     # VNet, subnets
│       └── identity.tf       # Managed Identity
└── environments/
    ├── dev/
    │   ├── main.tf
    │   ├── dev.tfvars
    │   └── backend.tf
    ├── staging/
    │   ├── main.tf
    │   ├── staging.tfvars
    │   └── backend.tf
    └── prod/
        ├── main.tf
        ├── prod.tfvars
        └── backend.tf
```

### 5.2 Root Module (`infra/main.tf`)

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = { source = "hashicorp/google", version = "~> 5.0" }
    aws    = { source = "hashicorp/aws", version = "~> 5.0" }
    azurerm = { source = "hashicorp/azurerm", version = "~> 3.0" }
    helm   = { source = "hashicorp/helm", version = "~> 2.0" }
  }
}

variable "cloud_provider" {
  type    = string
  default = "gcp"
  validation {
    condition     = contains(["gcp", "aws", "azure"], var.cloud_provider)
    error_message = "cloud_provider must be gcp, aws, or azure."
  }
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "region" {
  type    = string
  default = "us-central1"
}

# Conditional module invocation
module "gcp" {
  source      = "./modules/gcp"
  count       = var.cloud_provider == "gcp" ? 1 : 0
  environment = var.environment
  region      = var.region
  project_id  = var.gcp_project_id
}

module "aws" {
  source      = "./modules/aws"
  count       = var.cloud_provider == "aws" ? 1 : 0
  environment = var.environment
  region      = var.region
}

module "azure" {
  source      = "./modules/azure"
  count       = var.cloud_provider == "azure" ? 1 : 0
  environment = var.environment
  region      = var.region
}

# Helm deployment (runs after cluster is ready)
module "kubernetes" {
  source       = "hashicorp/terraform-kubernetes-helm-release"
  version      = "~> 1.0"
  cluster_endpoint = var.cloud_provider == "gcp" ? module.gcp[0].cluster_endpoint :
                     var.cloud_provider == "aws" ? module.aws[0].cluster_endpoint :
                     module.azure[0].cluster_endpoint
  chart_path   = "${path.module}/../helm/cognisys"
  values = {
    cloudProvider = var.cloud_provider
    environment   = var.environment
  }
}
```

### 5.3 GCP Module (`infra/modules/gcp/gke.tf`)

```hcl
resource "google_container_cluster" "primary" {
  name     = "cognisys-${var.environment}"
  location = var.region
  project  = var.project_id

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.main.self_link
  subnetwork = google_compute_subnet.main.self_link

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  addons_config {
    http_load_balancing { disabled = false }
    horizontal_pod_autoscaling { disabled = false }
  }
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "cognisys-nodes"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = var.node_count

  node_config {
    machine_type = "e2-medium"
    disk_size_gb = 50
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  autoscaling {
    min_node_count = 1
    max_node_count = 10
  }
}
```

### 5.4 AWS Module (`infra/modules/aws/eks.tf`)

```hcl
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "cognisys-${var.environment}"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    cognisys = {
      min_size     = 1
      max_size     = 10
      desired_size = 2
      instance_types = ["t3.medium"]
      disk_size    = 50
    }
  }

  enable_irsa = true
}
```

### 5.5 Azure Module (`infra/modules/azure/aks.tf`)

```hcl
resource "azurerm_kubernetes_cluster" "primary" {
  name                = "cognisys-${var.environment}"
  location            = var.region
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "cognisys-${var.environment}"

  default_node_pool {
    name       = "default"
    node_count = var.node_count
    vm_size    = "Standard_B2ms"
    auto_scaling_enabled = true
    min_count  = 1
    max_count  = 10
  }

  identity {
    type = "SystemAssigned"
  }

  oidc_issuer_enabled       = true
  workload_identity_enabled = true

  network_profile {
    network_plugin    = "azure"
    network_policy    = "calico"
    load_balancer_sku = "standard"
  }
}
```

---

## 6. CI/CD Pipeline (GitHub Actions)

### 6.1 Directory Structure

```
.github/workflows/
├── ci.yml                    # Build, test, lint on every PR
├── deploy-gcp.yml            # Deploy to GKE
├── deploy-aws.yml            # Deploy to EKS
├── deploy-azure.yml          # Deploy to AKS
└── deploy-all.yml            # Multi-cloud deploy (optional)
```

### 6.2 CI Pipeline (`.github/workflows/ci.yml`)

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker Image
        run: docker build -t cognisys/api:${{ github.sha }} .
      - name: Push to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Tag & Push
        run: |
          docker tag cognisys/api:${{ github.sha }} ghcr.io/${{ github.repository }}/cognisys:${{ github.sha }}
          docker push ghcr.io/${{ github.repository }}/cognisys:${{ github.sha }}
```

### 6.3 Deploy Pipeline (`.github/workflows/deploy-gcp.yml`)

```yaml
name: Deploy to GCP
on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [dev, staging, prod]
        default: dev
  push:
    branches: [main]
    paths:
      - 'server/**'
      - 'services/**'
      - 'Dockerfile'
      - 'infra/modules/gcp/**'
      - 'helm/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'dev' }}
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}

      - name: Configure GKE credentials
        uses: google-github-actions/get-gke-credentials@v2
        with:
          cluster_name: cognisys-${{ github.event.inputs.environment || 'dev' }}
          location: ${{ secrets.GCP_REGION }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        run: terraform init
        working-directory: infra/environments/${{ github.event.inputs.environment || 'dev' }}

      - name: Terraform Plan
        run: terraform plan -var="cloud_provider=gcp"
        working-directory: infra/environments/${{ github.event.inputs.environment || 'dev' }}

      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        run: terraform apply -auto-approve -var="cloud_provider=gcp"
        working-directory: infra/environments/${{ github.event.inputs.environment || 'dev' }}

      - name: Deploy to GKE
        run: |
          helm upgrade --install cognisys ./helm/cognisys \
            --namespace cognisys \
            --create-namespace \
            --set image.tag=${{ github.sha }} \
            --set cloudProvider=gcp \
            --values ./helm/cognisys/values.yaml
```

---

## 7. Configuration Management

### 7.1 Environment Variables

```bash
# ── Cloud Provider Selection ──
CLOUD_PROVIDER=gcp              # gcp | aws | azure

# ── Database ──
DB_PROVIDER=firestore           # firestore | dynamodb | cosmosdb | postgres
FIREBASE_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS=

# DynamoDB (AWS fallback)
AWS_DYNAMODB_REGION=
AWS_DYNAMODB_TABLE_PREFIX=

# Cosmos DB (Azure fallback)
COSMOSDB_ENDPOINT=
COSMOSDB_KEY=
COSMOSDB_DATABASE=

# PostgreSQL (portable fallback)
DATABASE_URL=postgresql://...

# ── Auth ──
AUTH_PROVIDER=firebase          # firebase | cognito | entra-id | auth0

# Firebase Auth
FIREBASE_AUTH_PROJECT_ID=

# Cognito (AWS fallback)
AWS_COGNITO_USER_POOL_ID=
AWS_COGNITO_CLIENT_ID=

# Entra ID (Azure fallback)
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=

# ── Storage ──
STORAGE_PROVIDER=gcs            # gcs | s3 | azure-blob

# GCS / Firebase Storage
FIREBASE_STORAGE_BUCKET=

# S3 (AWS fallback)
AWS_S3_BUCKET=
AWS_S3_REGION=

# Azure Blob (fallback)
AZURE_STORAGE_ACCOUNT=
AZURE_STORAGE_KEY=

# ── Vector Store ──
VECTOR_PROVIDER=firestore       # firestore | pinecone | qdrant

# Pinecone
PINECONE_API_KEY=
PINECONE_INDEX=
PINECONE_ENVIRONMENT=

# Qdrant
QDRANT_URL=
QDRANT_API_KEY=

# ── Stripe Billing ──
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=
STRIPE_PRICE_ENTERPRISE=

# ── AI Providers ──
GEMINI_API_KEY=
MISTRAL_API_KEY=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT_NAME=

# ── Application ──
NODE_ENV=production
PORT=8080
CORS_ORIGINS=https://app.cognisys.example.com
LOG_LEVEL=info

# ── Feature Flags ──
AI_STREAMING=true
VECTOR_MEMORY=true
PREDICTIVE_CORE=true
```

### 7.2 Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cognisys-config
data:
  CLOUD_PROVIDER: "{{ .Values.cloudProvider }}"
  DB_PROVIDER: "{{ .Values.config.DB_PROVIDER }}"
  AUTH_PROVIDER: "{{ .Values.config.AUTH_PROVIDER }}"
  STORAGE_PROVIDER: "{{ .Values.config.STORAGE_PROVIDER }}"
  VECTOR_PROVIDER: "{{ .Values.config.VECTOR_PROVIDER }}"
  NODE_ENV: "{{ .Values.config.NODE_ENV }}"
  PORT: "{{ .Values.config.PORT }}"
  LOG_LEVEL: "{{ .Values.config.LOG_LEVEL }}"
  AI_STREAMING: "true"
  VECTOR_MEMORY: "true"
```

---

## 8. Implementation Plan

### Phase 1 — Container & Kubernetes Foundation (3-4 days)

| Task | Details | Deliverable |
|---|---|---|
| 1.1 Dockerfile audit | Verify multi-stage build, security, health checks | Existing Dockerfile is good; minor optimizations |
| 1.2 Helm chart scaffolding | Create `helm/cognisys/` with deployment, service, ingress, configmap, secret templates | Helm chart structure |
| 1.3 Kubernetes manifests | Deployment, Service, Ingress, HPA, PDB, ConfigMap, Secret | `helm/cognisys/templates/` |
| 1.4 Local testing | Test with `minikube` or `kind` | Local deployment works |
| 1.5 Remove Cloud Build dependency | Replace `cloudbuild.yaml` with GitHub Actions workflow | `.github/workflows/ci.yml` |

### Phase 2 — Repository Abstraction (5-7 days)

| Task | Details | Deliverable |
|---|---|---|
| 2.1 Define `IRepository<T>` interface | Cloud-agnostic CRUD + query + batch + transaction | `server/repositories/interface.ts` |
| 2.2 Extract Firestore implementation | Move current Firestore code into `firestore.ts` implementing the interface | `server/repositories/firestore.ts` |
| 2.3 Create `RepositoryFactory` | Provider selection via `DB_PROVIDER` env var | `server/repositories/factory.ts` |
| 2.4 Update all repository consumers | Replace direct Firestore calls with `RepositoryFactory.create()` | All `server/repositories/*.ts` files |
| 2.5 Integration tests | Test each repository implementation with its provider | Test suite |

### Phase 3 — Auth Abstraction (3-5 days)

| Task | Details | Deliverable |
|---|---|---|
| 3.1 Define `IAuthProvider` interface | Token verification, user management, custom claims | `server/services/auth/interface.ts` |
| 3.2 Extract Firebase Auth implementation | Move current Firebase Admin Auth code | `server/services/auth/firebase.ts` |
| 3.3 Create `AuthFactory` | Provider selection via `AUTH_PROVIDER` env var | `server/services/auth/factory.ts` |
| 3.4 Update auth middleware | Use factory instead of direct Firebase calls | `server/middleware/auth.ts` |

### Phase 4 — Storage & Vector Abstraction (2-3 days)

| Task | Details | Deliverable |
|---|---|---|
| 4.1 Define `IStorageProvider` interface | Upload, download, delete, URL generation, listing | `server/services/storage/interface.ts` |
| 4.2 Define `IVectorStore` interface | Upsert, query, delete, filter | `server/services/vector/interface.ts` |
| 4.3 Extract current implementations | Firestore vectors → `firestore.ts` | `server/services/vector/firestore.ts` |
| 4.4 Create factories | `StorageFactory`, `VectorFactory` | Factory files |

### Phase 5 — Terraform Infrastructure (5-7 days)

| Task | Details | Deliverable |
|---|---|---|
| 5.1 Root module | Provider selection, conditional module invocation | `infra/main.tf` |
| 5.2 GCP module | GKE, VPC, IAM, Workload Identity | `infra/modules/gcp/` |
| 5.3 AWS module | EKS, VPC, IAM, OIDC | `infra/modules/aws/` |
| 5.4 Azure module | AKS, VNet, Managed Identity | `infra/modules/azure/` |
| 5.5 Environment configs | dev, staging, prod tfvars | `infra/environments/` |
| 5.6 Remote state backend | GCS bucket for Terraform state | Backend configuration |

### Phase 6 — CI/CD Pipeline (3-4 days)

| Task | Details | Deliverable |
|---|---|---|
| 6.1 CI workflow | Lint, test, build, push to GHCR | `.github/workflows/ci.yml` |
| 6.2 GCP deploy workflow | Auth, Terraform, Helm deploy | `.github/workflows/deploy-gcp.yml` |
| 6.3 AWS deploy workflow | Auth, Terraform, Helm deploy | `.github/workflows/deploy-aws.yml` |
| 6.4 Azure deploy workflow | Auth, Terraform, Helm deploy | `.github/workflows/deploy-azure.yml` |
| 6.5 Environment protection rules | Require approval for prod deploys | GitHub environment settings |

### Phase 7 — AWS Fallback Implementations (7-10 days)

| Task | Details | Deliverable |
|---|---|---|
| 7.1 DynamoDB repository | Implement `IRepository<T>` with DynamoDB Document Client | `server/repositories/dynamodb.ts` |
| 7.2 Cognito auth provider | Implement `IAuthProvider` with Cognito Identity Provider | `server/services/auth/cognito.ts` |
| 7.3 S3 storage provider | Implement `IStorageProvider` with AWS SDK v3 | `server/services/storage/s3.ts` |
| 7.4 Pinecone vector store | Implement `IVectorStore` with Pinecone SDK | `server/services/vector/pinecone.ts` |
| 7.5 AWS integration tests | Full test suite against AWS services (localstack or test account) | Test suite |

### Phase 8 — Azure Fallback Implementations (7-10 days)

| Task | Details | Deliverable |
|---|---|---|
| 8.1 Cosmos DB repository | Implement `IRepository<T>` with Cosmos DB SDK | `server/repositories/cosmosdb.ts` |
| 8.2 Entra ID auth provider | Implement `IAuthProvider` with MSAL | `server/services/auth/entra-id.ts` |
| 8.3 Azure Blob storage | Implement `IStorageProvider` with Azure SDK | `server/services/storage/azure-blob.ts` |
| 8.4 Qdrant vector store | Implement `IVectorStore` with Qdrant client | `server/services/vector/qdrant.ts` |
| 8.5 Azure integration tests | Full test suite against Azure services | Test suite |

### Phase 9 — Multi-Cloud Testing & Validation (5-7 days)

| Task | Details | Deliverable |
|---|---|---|
| 9.1 Cross-cloud smoke tests | Deploy to each cloud, run full test suite | Test results per cloud |
| 9.2 Failover testing | Simulate provider failure, verify fallback activation | Failover test report |
| 9.3 Performance benchmarking | Compare latency, throughput across clouds | Benchmark report |
| 9.4 Cost analysis | Compare monthly cost per cloud for equivalent workload | Cost comparison |
| 9.5 Runbook documentation | Operational procedures for each cloud | `docs/OPERATIONS_RUNBOOK.md` |

---

## 9. Testing Strategy

### 9.1 Unit Tests
- Repository interface contract tests (run against all implementations)
- Auth provider interface contract tests
- Storage provider interface contract tests
- Factory pattern tests (correct provider selection)

### 9.2 Integration Tests
- **LocalStack** for AWS service emulation (DynamoDB, Cognito, S3)
- **Azurite** for Azure service emulation (Cosmos DB, Blob Storage)
- **Firestore Emulator** for GCP testing
- Full CRUD operations against each provider

### 9.3 E2E Tests
- Deploy to `kind` (local Kubernetes) with each provider configuration
- Verify full application flow: auth → API → database → storage
- Test provider switching via environment variable changes

### 9.4 Load Tests
- k6 load tests against each cloud deployment
- Compare latency, throughput, error rates
- Validate HPA scaling behavior

---

## 10. Cost Estimation

### 10.1 Per-Cloud Monthly Cost (Estimate, dev environment)

| Resource | GCP (GKE) | AWS (EKS) | Azure (AKS) |
|---|---|---|---|
| Kubernetes (2 nodes, e2-medium/t3.medium/B2ms) | ~$50 | ~$60 | ~$55 |
| Database (Firestore/DynamoDB/Cosmos DB) | ~$20 | ~$25 | ~$30 |
| Auth (Firebase/Cognito/Entra ID) | Free (up to 50K MAU) | ~$10 | ~$10 |
| Storage (GCS/S3/Blob, 10GB) | ~$2 | ~$2 | ~$2 |
| Load Balancer | ~$20 | ~$20 | ~$20 |
| **Total (dev)** | **~$92** | **~$117** | **~$117** |

### 10.2 Production (3 nodes, HA database)

| Resource | GCP | AWS | Azure |
|---|---|---|---|
| Kubernetes (3 nodes, e2-standard-2) | ~$150 | ~$180 | ~$165 |
| Database (HA Firestore/DynamoDB/Cosmos DB) | ~$100 | ~$120 | ~$140 |
| Load Balancer + CDN | ~$40 | ~$45 | ~$40 |
| **Total (prod)** | **~$290** | **~$345** | **~$345** |

---

## 11. Operational Runbook (Summary)

### 11.1 Deploying to a New Cloud
```bash
# 1. Set up cloud credentials
export CLOUD_PROVIDER=aws
terraform init -reconfigure
terraform plan -var="cloud_provider=aws"
terraform apply -var="cloud_provider=aws"

# 2. Deploy application
helm upgrade --install cognisys ./helm/cognisys \
  --namespace cognisys --create-namespace \
  --values ./helm/cognisys/values-aws.yaml \
  --set image.tag=latest
```

### 11.2 Switching Database Provider
```bash
# Change environment variable, rolling restart
kubectl set env deployment/cognisys DB_PROVIDER=dynamodb
kubectl rollout restart deployment/cognisys
```

### 11.3 Monitoring & Alerting
- **Health checks:** `/api/health` endpoint (already configured)
- **Metrics:** OpenTelemetry → Prometheus → Grafana (portable)
- **Logs:** Pino structured logs → cloud-native log aggregator
- **Alerts:** Pod restarts, error rate > 1%, latency p99 > 2s

### 11.4 Disaster Recovery
- **Primary cloud failure:** DNS failover to backup cloud (Cloudflare)
- **Database failure:** Restore from Firestore/DynamoDB/Cosmos DB backups
- **Configuration drift:** Terraform state reconciliation
- **Secret rotation:** Automated via cloud secret managers

---

## 12. Key Files Reference

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage build (already portable) |
| `docker-compose.yml` | Local development |
| `cloudbuild.yaml` | GCP Cloud Build (to be replaced) |
| `firebase.ts` | Firebase Admin SDK (to be abstracted) |
| `firebase-applet-config.json` | Firebase client config |
| `server/repositories/` | Data access (to implement interface) |
| `server/middleware/` | Auth middleware (to use factory) |
| `server/services/BillingService.ts` | Stripe billing (cloud-agnostic) |
| `server/services/UsageMeteringService.ts` | Usage tracking (cloud-agnostic) |

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Firestore query limitations** | DynamoDB/Cosmos DB have different query models | Design interface around lowest common denominator; use composite keys |
| **Firebase Auth custom claims** | Cognito/Entra ID have different claim models | Map claims to a common schema in the interface |
| **Data migration complexity** | Moving data between providers is non-trivial | Build export/import tools; use dual-write during migration |
| **Increased operational complexity** | Managing multiple cloud configs | Use Terraform + Helm to automate; document everything |
| **Cost of running multiple clouds** | Paying for idle backup infrastructure | Use active-passive (not active-active); backup cloud only on failover |
| **Testing matrix explosion** | 3 clouds × 4 providers × 3 environments | Automated CI/CD; contract tests; use emulators locally |

---

## 14. Summary

CogniSys BA's Docker-based architecture is already **well-positioned for multi-cloud deployment**. The primary work is building **abstraction layers** around Firebase/Firestore dependencies and establishing **Kubernetes + Terraform + GitHub Actions** as the portable deployment foundation.

**Critical path items:**
1. Repository abstraction layer (biggest effort, highest impact)
2. Helm chart for Kubernetes deployment
3. Terraform modules for infrastructure
4. GitHub Actions CI/CD pipeline
5. AWS and Azure fallback implementations

**Estimated total effort:** 40-57 engineering days (8-11 weeks for a single engineer)

**Recommended starting point:** Phase 1 (Kubernetes foundation) + Phase 2 (repository abstraction) — these unlock all subsequent phases and can be done without disrupting the current GCP deployment.
