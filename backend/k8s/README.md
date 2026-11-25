# E-Commerce Backend Microservices — Kubernetes Setup

Simple Kubernetes deployment manifests for the nine existing backend microservices inside the `ecom-microservices` namespace.

---

## 1. Basic Kubernetes Architecture

- **Namespace (`ecom-microservices`)**: Isolates all backend workloads (`namespace.yaml`).
- **ConfigMap (`backend-config`)**: Supplies internal Kubernetes Service DNS URLs (`AUTH_SERVICE_URL`..`TICKET_SERVICE_URL`), `CORS_ORIGINS`, non-sensitive MongoDB database names (`*_DB_NAME`), `ALGORITHM`, and `ACCESS_TOKEN_EXPIRE_MINUTES` (`configmap.yaml`).
- **Secret (`ecommerce-secrets`)**: Supplies `MONGO_URI` and `SECRET_KEY` (template in `secrets/secret.example.yaml`).
- **Nine Deployments & ClusterIP Services**: Each microservice runs with `1` replica and is exposed internally via a `ClusterIP` Service.
  - `api-gateway` routes `/api/*` requests to all eight downstream services using Kubernetes DNS.
  - `order-service` also calls `cart-service` and `product-service` via `CART_SERVICE_URL` and `PRODUCT_SERVICE_URL`.
- **External MongoDB**: MongoDB remains external to the cluster and is configured via `MONGO_URI` in `ecommerce-secrets`.

---

## 2. Microservices and Ports

| Microservice | Deployment / Service Name | Port | Image |
|---|---|---:|---|
| API Gateway | `api-gateway` | 8000 | `backend-gateway:latest` |
| Auth | `auth-service` | 8001 | `backend-auth_service:latest` |
| Product | `product-service` | 8002 | `backend-product_service:latest` |
| Cart | `cart-service` | 8003 | `backend-cart_service:latest` |
| Order | `order-service` | 8004 | `backend-order_service:latest` |
| Admin | `admin-service` | 8005 | `backend-admin_service:latest` |
| Review | `review-service` | 8006 | `backend-review_service:latest` |
| Wishlist | `wishlist-service` | 8007 | `backend-wishlist_service:latest` |
| Ticket | `ticket-service` | 8008 | `backend-ticket_service:latest` |

---

## 3. Build Docker Images

Run from `ecommerce/backend/`:

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

---

## 4. Create or Use a `kind` Cluster

Create a cluster (skip if you already have one):

```bash
kind create cluster --name ecommerce-backend
```

Load the nine built images into the `kind` cluster:

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

---

## 5. Configure Secrets & Apply Manifests

From `ecommerce/backend/`:

1. Create your Secret file from the template and update `MONGO_URI` and `SECRET_KEY`:

```bash
cp k8s/secrets/secret.example.yaml k8s/secrets/secret.yaml
```

> **MongoDB Connectivity Note**:
> - For MongoDB Atlas or a remote server, set `MONGO_URI` to its connection string.
> - For MongoDB on a Linux host with `kind`, use the `kind` Docker bridge gateway IP (check with `docker network inspect kind -f '{{(index .IPAM.Config 0).Gateway}}'`, usually `172.18.0.1`), e.g. `mongodb://172.18.0.1:27017/?directConnection=true`.
> - For Docker Desktop (macOS/Windows), use `mongodb://host.docker.internal:27017/?directConnection=true`.

2. Apply namespace, ConfigMap, Secret, Deployments, and Services:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets/secret.yaml
kubectl apply -f k8s/
```

---

## 6. Check Pods and Services

```bash
kubectl get pods -n ecom-microservices
kubectl get services -n ecom-microservices
kubectl get deployments -n ecom-microservices
```

---

## 7. View Pod Logs

```bash
kubectl logs -n ecom-microservices deployment/api-gateway
kubectl logs -n ecom-microservices deployment/auth-service
kubectl logs -n ecom-microservices deployment/order-service
```

Add `-f` to stream logs live.

---

## 8. Access the API Gateway via Port-Forwarding

```bash
kubectl port-forward -n ecom-microservices svc/api-gateway 8000:8000
```

Test the gateway:

```bash
curl http://127.0.0.1:8000/
# {"message":"API Gateway Running"}

curl http://127.0.0.1:8000/api/auth/health
```

---

## 9. Remove Kubernetes Resources

Delete only the project's Kubernetes resources (this does not delete Docker images, source files, or external MongoDB data):

```bash
kubectl delete namespace ecom-microservices
```

