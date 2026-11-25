# E-Commerce Microservices — Kubernetes Infrastructure Guide

This directory (`k8s/`) provides an **additive** Kubernetes deployment and orchestration layer for the E-Commerce Microservices application. None of the existing application source code, existing Dockerfiles, or `backend/docker-compose.yml` were modified.

---

## 1. Kubernetes Architecture

All Kubernetes workloads run inside the dedicated **`ecommerce`** namespace:

- **Frontend (`frontend`)**: React 19 + Vite static bundle built via multi-stage Docker build (`k8s/frontend/Dockerfile`) and served by Nginx on port `80`, exposed internally via a `ClusterIP` Service (`frontend:80`).
- **API Gateway (`api-gateway`)**: FastAPI reverse-proxy on port `8000`, exposed via `ClusterIP` Service (`api-gateway:8000`), routing `/api/*` traffic to the eight downstream microservices.
- **Eight Backend Microservices**: Each runs as an independent `Deployment` + `ClusterIP` `Service` on its dedicated port (`8001`–`8008`).
- **Configuration & Secrets**:
  - `gateway-config` (`ConfigMap`): Internal Kubernetes DNS URLs for all eight backend services and `CORS_ORIGINS`.
  - `db-config` (`ConfigMap`): Non-sensitive MongoDB database names (`*_DB_NAME`), JWT algorithm/expiry (`ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`), and `UPLOAD_DIR`.
  - `frontend-config` (`ConfigMap`): Nginx SPA configuration (`default.conf`) mounted into the `frontend` container.
  - `ecommerce-secrets` (`Secret`): Sensitive `MONGO_URI` and `SECRET_KEY` (created locally from `k8s/secrets/secret.example.yaml`, never committed).
- **External MongoDB**: MongoDB remains an external dependency outside the cluster (local host MongoDB or MongoDB Atlas) configured via `MONGO_URI` in `ecommerce-secrets`.
- **Optional Ingress (`ecommerce-ingress`)**: Routes `/api` Mobileto `api-gateway:8000` and `/` to `frontend:80` when an Ingress Controller is installed.
- **Optional Autoscaling (`api-gateway-hpa`)**: `autoscaling/v2` HorizontalPodAutoscaler targeting `api-gateway` (`1` to `5` replicas at `70%` CPU utilization).

```
Browser (localhost:3000)
   │
   ├── kubectl port-forward svc/frontend 3000:80 ──▶ frontend (Nginx :80)
   │
   └── Axios (http://127.0.0.1:8000)
          └── kubectl port-forward svc/api-gateway 8000:8000 ──▶ api-gateway (:8000)
                                                                    │
                     ┌──────────────┬──────────────┬────────────────┼────────────────┐
                     ▼              ▼              ▼                ▼                ▼
               auth-service  product-service  cart-service   order-service    admin-service
                  (:8001)        (:8002)        (:8003)         (:8004)          (:8005)
                                                  ▲                │
                                                  └────────────────┴── calls cart & product
                     ┌──────────────┬──────────────┐
                     ▼              ▼              ▼
               review-service wishlist-service ticket-service
                  (:8006)        (:8007)        (:8008)
                     │
                     ▼
             External MongoDB (MONGO_URI via ecommerce-secrets)
```

---

## 2. How the Nine Microservices Communicate

Kubernetes CoreDNS automatically resolves every `ClusterIP` Service name within the `ecommerce` namespace:

| Service | K8s Resource Name | Port | DNS URL | Communicates With |
|---|---|---:|---|---|
| API Gateway | `api-gateway` | 8000 | `http://api-gateway:8000` | All 8 downstream services via `gateway-config` |
| Auth Service | `auth-service` | 8001 | `http://auth-service:8001` | MongoDB (`auth_db`) |
| Product Service | `product-service` | 8002 | `http://product-service:8002` | MongoDB (`product_db`, `order_db`) |
| Cart Service | `cart-service` | 8003 | `http://cart-service:8003` | MongoDB (`cart_db`, `product_db`) |
| Order Service | `order-service` | 8004 | `http://order-service:8004` | `cart-service:8003`, `product-service:8002`, MongoDB (`order_db`, `product_db`) |
| Admin Service | `admin-service` | 8005 | `http://admin-service:8005` | MongoDB (`product_db`, `order_db`, `auth_db`) |
| Review Service | `review-service` | 8006 | `http://review-service:8006` | MongoDB (`review_db`, `product_db`, `order_db`, `auth_db`) |
| Wishlist Service | `wishlist-service` | 8007 | `http://wishlist-service:8007` | MongoDB (`wishlist_db`, `product_db`) |
| Ticket Service | `ticket-service` | 8008 | `http://ticket-service:8008` | MongoDB (`ticket_db`) |

Notice that `order-service` also makes HTTP calls to `CART_SERVICE_URL` (`http://cart-service:8003`) during checkout and `PRODUCT_SERVICE_URL` (`http://product-service:8002`) during order cancellation, so both variables are injected into `order-service` from `gateway-config`.

### Health Probes Note

- `api-gateway` exposes `GET /` and `auth-service` exposes `GET /health`; both use `httpGet` readiness and liveness probes.
- `frontend` (Nginx) uses `httpGet` on `/` port `80`.
- The other seven backend services do not define `/health` endpoints in the existing codebase, so they use `tcpSocket` probes on their container ports rather than inventing HTTP health endpoints.

---

## 3. Kubernetes Directory Structure

```
k8s/
├── .gitignore
├── README.md
├── namespace.yaml
├── configmaps/
│   ├── db-config.yaml
│   ├── frontend-config.yaml
│   └── gateway-config.yaml
├── secrets/
│   └── secret.example.yaml
├── backend/
│   ├── gateway/{deployment.yaml,service.yaml}
│   ├── auth/{deployment.yaml,service.yaml}
│   ├── product/{deployment.yaml,service.yaml}
│   ├── cart/{deployment.yaml,service.yaml}
│   ├── order/{deployment.yaml,service.yaml}
│   ├── admin/{deployment.yaml,service.yaml}
│   ├── review/{deployment.yaml,service.yaml}
│   ├── wishlist/{deployment.yaml,service.yaml}
│   └── ticket/{deployment.yaml,service.yaml}
├── frontend/
│   ├── Dockerfile
│   ├── deployment.yaml
│   └── service.yaml
├── ingress/
│   └── ingress.yaml
├── autoscaling/
│   └── gateway-hpa.yaml
└── scripts/
    ├── build-images.sh
    ├── deploy.sh
    ├── delete.sh
    └── status.sh
```

---

## 4. Prerequisites

- **Docker** (Engine 24+ / Docker Desktop)
- **kubectl** (v1.28+)
- **Local Kubernetes cluster**: `kind` (v0.20+) or `minikube`
- **External MongoDB** reachable from inside cluster pods (e.g., MongoDB Atlas, a managed MongoDB server, or MongoDB running on the host machine)

---

## 5. Installing and Configuring `kubectl`

Verify if `kubectl` is installed:

```bash
kubectl version --client
```

If not installed on Linux:

```bash
curl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

Verify your active cluster context:

```bash
kubectl config current-context
kubectl cluster-info
```

---

## 6. Running the Project with `kind`

Install `kind` if needed (Linux amd64):

```bash
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.26.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

Create a local `kind` cluster:

```bash
kind create cluster --name ecommerce
```

Verify the node is `Ready`:

```bash
kubectl get nodes
```

---

## 7. Building Docker Images

From the project root (`ecommerce/`), run:

```bash
./k8s/scripts/build-images.sh
```

This builds:
- 9 backend images using the existing Dockerfiles in `backend/microservices/<service>/Dockerfile` with `backend/` as the Docker build context:
  - `ecommerce-gateway:latest`
  - `ecommerce-auth-service:latest`
  - `ecommerce-product-service:latest`
  - `ecommerce-cart-service:latest`
  - `ecommerce-order-service:latest`
  - `ecommerce-admin-service:latest`
  - `ecommerce-review-service:latest`
  - `ecommerce-wishlist-service:latest`
  - `ecommerce-ticket-service:latest`
- 1 frontend image using `k8s/frontend/Dockerfile` with `frontend/` as the build context:
  - `ecommerce-frontend:latest`

You can customize the tag or prefix without pushing anywhere:

```bash
./k8s/scripts/build-images.sh --tag v1.0.0
```

---

## 8. Loading Images into the Cluster

### Using `kind`

Either build and load in a single command:

```bash
./k8s/scripts/build-images.sh --kind-cluster ecommerce
```

Or load the images manually into an existing `kind` cluster:

```bash
for svc in gateway auth-service product-service cart-service order-service admin-service review-service wishlist-service ticket-service frontend; do
  kind load docker-image "ecommerce-${svc}:latest" --name ecommerce
done
```

### Using `minikube`

```bash
./k8s/scripts/build-images.sh --minikube
```

All Deployments use `imagePullPolicy: IfNotPresent` so Kubernetes uses locally loaded images without trying to pull from a remote registry.

---

## 9. Configuring Kubernetes Secrets (MongoDB & JWT)

1. Copy the example secret manifest:

```bash
cp k8s/secrets/secret.example.yaml k8s/secrets/secret.yaml
```

2. Edit `k8s/secrets/secret.yaml` and replace `MONGO_URI` and `SECRET_KEY` with your real values:

```yaml
stringData:
  MONGO_URI: "mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority"
  SECRET_KEY: "your-strong-random-jwt-secret"
```

### Connecting to MongoDB Running on Your Host Machine (Linux `kind`)

- On Linux `kind`, pods cannot reach host `localhost` or `127.0.0.1` directly.
- Find the `kind` Docker bridge gateway IP:
  ```bash
  docker network inspect kind -f '{{(index .IPAM.Config 0).Gateway}}'
  ```
- Use that IP (commonly `172.18.0.1`) in `MONGO_URI` (e.g. `mongodb://172.18.0.1:27017/?directConnection=true`), and ensure `mongod` is listening on `0.0.0.0` (or that bridge IP) and firewall rules allow port `27017`.
- On Docker Desktop (macOS/Windows), `mongodb://host.docker.internal:27017/?directConnection=true` typically resolves to the host.

> **Security**: `k8s/secrets/secret.yaml` is ignored by `k8s/.gitignore`. Never commit real credentials or `.env` files.

---

## 10. Deploying the Application

Run the deployment script from the project root:

```bash
./k8s/scripts/deploy.sh
```

Optional flags:
- `--with-ingress`: Also apply `k8s/ingress/ingress.yaml` (requires an Ingress Controller).
- `--with-hpa`: Also apply `k8s/autoscaling/gateway-hpa.yaml` (requires Metrics Server).
- `--use-example-secret`: Apply `secret.example.yaml` for quick local smoke-testing if `secret.yaml` has not been created yet.

Check cluster status anytime with:

```bash
./k8s/scripts/status.sh
```

---

## 11. Accessing the Frontend and Backend

### Important Existing Application Limitation

In `frontend/src/api.js`, the Axios client has its API base URL hardcoded to:

```js
baseURL: "http://127.0.0.1:8000"
```

Because existing application source code must not be modified, **all browser API requests go to `http://127.0.0.1:8000` regardless of where the frontend is hosted**.

- **Local Kubernetes testing**: Port-forwarding `api-gateway` to local port `8000` and `frontend` to local port `3000` (Section 12) allows the unmodified frontend and backend to work seamlessly in your browser.
- **External / Production browser deployment**: Production browser access will **not** work over external domains/Ingress alone until an approved future application change updates `frontend/src/api.js` to use a relative path (e.g., `/api` or `import.meta.env.VITE_API_URL`) and builds with the corresponding API URL.

### Optional Ingress Setup

`k8s/ingress/ingress.yaml` routes:
- `ecommerce.local/api/*` -> `api-gateway:8000`
- `ecommerce.local/*` -> `frontend:80`

An Ingress Controller is **not** installed by default. To install `ingress-nginx` on `kind`:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s
```

Then deploy with Ingress enabled:

```bash
./k8s/scripts/deploy.sh --with-ingress
```

Map `127.0.0.1 ecommerce.local` in `/etc/hosts` if testing Ingress locally.

---

## 12. Port-Forwarding (Recommended for Local Testing)

Run these in two separate terminals (or backgrounded) so the browser can reach both the UI and `http://127.0.0.1:8000`:

```bash
# Terminal 1: Expose Frontend on http://localhost:3000
kubectl port-forward -n ecommerce svc/frontend 3000:80

# Terminal 2: Expose API Gateway on http://127.0.0.1:8000
kubectl port-forward -n ecommerce svc/api-gateway 8000:8000
```

Then open [http://localhost:3000](http://localhost:3000) in your browser, and verify the API Gateway directly:

```bash
curl http://127.0.0.1:8000/
# {"message":"API Gateway Running"}
```

---

## 13. Viewing Logs

View logs for any service:

```bash
kubectl logs -n ecommerce deployment/api-gateway -f
kubectl logs -n ecommerce deployment/auth-service -f
kubectl logs -n ecommerce deployment/order-service -f
kubectl logs -n ecommerce deployment/frontend -f
```

View logs from a previous crashed container instance:

```bash
kubectl logs -n ecommerce deployment/auth-service --previous
```

---

## 14. Scaling Deployments Manually

Scale any stateless deployment manually (for example, `product-service` or `api-gateway`):

```bash
kubectl scale deployment/api-gateway -n ecommerce --replicas=3
kubectl scale deployment/product-service -n ecommerce --replicas=2
```

Verify updated pods:

```bash
kubectl get pods -n ecommerce -l app=api-gateway
```

---

## 15. Testing HPA (Horizontal Pod Autoscaler)

`k8s/autoscaling/gateway-hpa.yaml` scales `api-gateway` between `1` and `5` replicas when average CPU utilization exceeds `70%`.

### Prerequisite: Install Metrics Server

HPA requires Kubernetes Metrics Server. In `kind`, install Metrics Server with `--kubelet-insecure-tls`:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
```

Verify Metrics Server works:

```bash
kubectl top pods -n ecommerce
```

### Apply and Test HPA

```bash
kubectl apply -f k8s/autoscaling/gateway-hpa.yaml
```

Watch the HPA in one terminal:

```bash
kubectl get hpa -n ecommerce -w
```

Generate CPU load against `api-gateway` from inside the cluster in another terminal:

```bash
kubectl run load-generator -n ecommerce --image=busybox:1.36 --restart=Never -- /bin/sh -c \
  "while true; do wget -q -O- http://api-gateway:8000/ >/dev/null 2>&1; done"
```

After 1–2 minutes, `TARGETS` CPU% will rise above `70%` and `REPLICAS` will scale up. Clean up the load generator afterwards:

```bash
kubectl delete pod load-generator -n ecommerce
```

---

## 16. Troubleshooting Common Errors

| Symptom | Likely Cause | Fix |
|---|---|---|
| `ErrImagePull` or `ImagePullBackOff` | Local image not loaded into `kind`/`minikube` | Run `./k8s/scripts/build-images.sh --kind-cluster ecommerce` (or `minikube image load`) |
| `CreateContainerConfigError` | `ecommerce-secrets` Secret missing | Create `k8s/secrets/secret.yaml` from `secret.example.yaml` and re-run `./k8s/scripts/deploy.sh` |
| API calls fail with `500` or MongoDB timeout | `MONGO_URI` unreachable from pods | Check host firewall/bindIp (`0.0.0.0`) or Atlas IP allowlist; verify `MONGO_URI` in `secret.yaml` |
| Browser login/products fail when opening `frontend` | `api-gateway` port-forward not running on `8000` | Run `kubectl port-forward -n ecommerce svc/api-gateway 8000:8000` |
| HPA shows `<unknown>/70%` | Metrics Server not installed or missing `--kubelet-insecure-tls` on `kind` | Install and patch Metrics Server as shown in Section 15 |
| `admin-service` uploaded images lost after pod restart | `admin-service` writes uploads to container filesystem (`UPLOAD_DIR`) | Existing app uses local disk without shared PVC; mount a PVC if persistence across restarts is needed |

---

## 17. Cleaning Up Kubernetes Resources Safely

Delete **only** the Kubernetes resources in the `ecommerce` namespace:

```bash
./k8s/scripts/delete.sh
```

This removes all deployments, services, configmaps, secrets, ingress, HPA, and the `ecommerce` namespace. It **never** deletes Docker images, application source files, or external MongoDB databases.

To also delete the local `kind` cluster itself:

```bash
kind delete cluster --name ecommerce
```

