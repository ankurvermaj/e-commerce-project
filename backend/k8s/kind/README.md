# Testing Backend Kubernetes Setup with `kind`

## How `kind` Gets Docker Images

`kind` runs Kubernetes inside a Docker container, so it **cannot** see images on your host Docker daemon automatically. You must:
1. Build the 9 backend images on your host.
2. Load them into the `kind` cluster with `kind load docker-image`.

Because `auth-deployment.yaml` uses `imagePullPolicy: Never` and the other 8 Deployments use `imagePullPolicy: IfNotPresent`, Kubernetes will use the loaded local images without pulling from Docker Hub.

---

## Step-by-Step Test Commands

Run all commands from `ecommerce/backend/`:

### 1. Create the `kind` cluster

```bash
kind create cluster --config k8s/kind/kind-config.yaml
```

### 2. Build all 9 backend Docker images

```bash
docker build -f microservices/gateway/Dockerfile -t backend-gateway:latest .
docker build -f microservices/auth_service/Dockerfile -t backend-auth_service:latest .
docker build -f microservices/product_service/Dockerfile -t backend-product_service:latest .
docker build -f microservices/cart_service/Dockerfile -t backend-cart_service:latest .
docker build -f microservices/order_service/Dockerfile -t backend-order_service:latest .
docker build -f microservices/admin_service/Dockerfile -t backend-admin_service:latest .
docker build -f microservices/review_service/Dockerfile -t backend-review_service:latest .
docker build -f microservices/wishlist_service/Dockerfile -t backend-wishlist_service:latest .
docker build -f microservices/ticket_service/Dockerfile -t backend-ticket_service:latest .
```

### 3. Load all 9 images into `kind`

```bash
kind load docker-image \
  backend-gateway:latest \
  backend-auth_service:latest \
  backend-product_service:latest \
  backend-cart_service:latest \
  backend-order_service:latest \
  backend-admin_service:latest \
  backend-review_service:latest \
  backend-wishlist_service:latest \
  backend-ticket_service:latest \
  --name ecommerce-backend
```

### 4. Apply Namespace, ConfigMap, Secret, and Workloads

Create the Secret directly in the cluster (so no real credentials are saved in Git):

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml

kubectl create secret generic ecommerce-secrets \
  -n ecom-microservices \
  --from-literal=MONGO_URI="mongodb://172.18.0.1:27017/?directConnection=true" \
  --from-literal=SECRET_KEY="your-test-secret-key"

kubectl apply -f k8s/
```

*(If your MongoDB is on Atlas or another host, replace `MONGO_URI` accordingly.)*

### 5. Verify Pods & Test API Gateway

```bash
kubectl get pods -n ecom-microservices
kubectl port-forward -n ecom-microservices svc/api-gateway 8000:8000
```

In another terminal:

```bash
curl http://127.0.0.1:8000/
curl http://127.0.0.1:8000/api/auth/health
```

### 6. Clean Up

```bash
kind delete cluster --name ecommerce-backend
```

