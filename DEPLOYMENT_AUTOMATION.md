# Deployment Automation

## Overview
This document describes the deployment automation setup for the CallStack VoIP platform using Helm charts and GitOps workflows.

## Prerequisites

1. **Kubernetes Cluster**: A running Kubernetes cluster (v1.20+)
2. **Helm 3**: Installed and configured
3. **kubectl**: Configured to access the cluster
4. **Container Registry**: Access to a container registry (Docker Hub, GHCR, etc.)

## Quick Start

### 1. Install Dependencies

```bash
# Install Helm 3
curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash

# Add required Helm repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

### 2. Prepare Environment

```bash
# Create namespace
kubectl create namespace callstack

# Create secrets
kubectl create secret generic callstack-secrets \
  --from-literal=jwt-secret='your-super-secret-jwt-key' \
  --from-literal=database-url='postgresql://callstack:password@postgresql:5432/callstack' \
  --from-literal=stripe-secret-key='sk_test_your_stripe_secret_key' \
  --from-literal=stripe-webhook-secret='whsec_your_webhook_secret' \
  --namespace=callstack
```

### 3. Deploy with Helm

```bash
# Deploy the application
helm install callstack ./infra/helm/callstack \
  --namespace callstack \
  --values ./infra/helm/callstack/values.yaml \
  --set image.tag=v1.0.0 \
  --set config.environment=production \
  --set ingress.hosts[0].host=callstack.example.com \
  --set config.allowedOrigins=https://callstack.example.com
```

### 4. Verify Deployment

```bash
# Check pod status
kubectl get pods -n callstack

# Check services
kubectl get services -n callstack

# Check ingress
kubectl get ingress -n callstack

# Check application logs
kubectl logs -f deployment/callstack -n callstack
```

## Environment Configuration

### Development Environment

```bash
helm install callstack-dev ./infra/helm/callstack \
  --namespace callstack-dev \
  --values ./infra/helm/callstack/values-dev.yaml \
  --set replicaCount=1 \
  --set config.environment=development \
  --set monitoring.enabled=false
```

### Staging Environment

```bash
helm install callstack-staging ./infra/helm/callstack \
  --namespace callstack-staging \
  --values ./infra/helm/callstack/values-staging.yaml \
  --set replicaCount=2 \
  --set config.environment=staging \
  --set monitoring.enabled=true
```

### Production Environment

```bash
helm install callstack-prod ./infra/helm/callstack \
  --namespace callstack-prod \
  --values ./infra/helm/callstack/values-prod.yaml \
  --set replicaCount=3 \
  --set config.environment=production \
  --set autoscaling.enabled=true \
  --set monitoring.enabled=true \
  --set backup.enabled=true
```

## GitOps with ArgoCD

### 1. Install ArgoCD

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### 2. Configure ArgoCD Application

```yaml
# argocd-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: callstack
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/yourorg/callstack.git
    targetRevision: HEAD
    path: infra/helm/callstack
  destination:
    server: https://kubernetes.default.svc
    namespace: callstack
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

### 3. Deploy ArgoCD Application

```bash
kubectl apply -f argocd-application.yaml
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Kubernetes

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Helm
        uses: azure/setup-helm@v3
        with:
          version: 'v3.10.0'
          
      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG }}
          
      - name: Deploy to staging
        if: github.ref == 'refs/heads/develop'
        run: |
          helm upgrade --install callstack-staging ./infra/helm/callstack \
            --namespace callstack-staging \
            --values ./infra/helm/callstack/values-staging.yaml \
            --set image.tag=${{ github.sha }}
            
      - name: Deploy to production
        if: github.ref == 'refs/heads/main'
        run: |
          helm upgrade --install callstack-prod ./infra/helm/callstack \
            --namespace callstack-prod \
            --values ./infra/helm/callstack/values-prod.yaml \
            --set image.tag=${{ github.sha }}
```

## Monitoring and Alerting

### Prometheus Monitoring

The Helm chart includes Prometheus monitoring with:

- **Metrics Collection**: Application metrics, Kubernetes metrics
- **Alerting Rules**: Pre-configured alerting rules
- **Dashboards**: Grafana dashboards for visualization

### Health Checks

```bash
# Check application health
kubectl get pods -n callstack -l app.kubernetes.io/name=callstack

# Check application metrics
kubectl port-forward svc/callstack-prometheus 9090:9090 -n callstack

# Access Grafana
kubectl port-forward svc/callstack-grafana 3000:3000 -n callstack
```

## Backup and Recovery

### Automated Backups

```bash
# Enable backup
helm upgrade callstack ./infra/helm/callstack \
  --set backup.enabled=true \
  --set backup.schedule="0 2 * * *" \
  --set backup.retention="30d"
```

### Manual Backup

```bash
# Backup database
kubectl exec -n callstack deployment/postgresql -- pg_dump callstack > backup.sql

# Backup application data
kubectl exec -n callstack deployment/callstack -- tar -czf /tmp/backup.tar.gz /app/data
```

## Rollback Procedures

### Helm Rollback

```bash
# List deployment history
helm history callstack -n callstack

# Rollback to previous version
helm rollback callstack 1 -n callstack

# Rollback to specific revision
helm rollback callstack 2 -n callstack
```

### Emergency Rollback

```bash
# Scale down to zero
kubectl scale deployment callstack --replicas=0 -n callstack

# Scale back up
kubectl scale deployment callstack --replicas=3 -n callstack

# Force restart
kubectl rollout restart deployment/callstack -n callstack
```

## Troubleshooting

### Common Issues

1. **Pod Not Starting**
   ```bash
   kubectl describe pod -n callstack
   kubectl logs -f deployment/callstack -n callstack
   ```

2. **Ingress Not Working**
   ```bash
   kubectl describe ingress callstack -n callstack
   kubectl get ingress -n callstack
   ```

3. **Database Connection Issues**
   ```bash
   kubectl exec -n callstack deployment/postgresql -- psql -U callstack -d callstack
   ```

### Debug Commands

```bash
# Check all resources
kubectl get all -n callstack

# Check events
kubectl get events -n callstack --sort-by='.lastTimestamp'

# Port forward for debugging
kubectl port-forward deployment/callstack 3000:3000 -n callstack

# Access shell
kubectl exec -it deployment/callstack -- /bin/sh -n callstack
```

## Security Considerations

1. **Network Policies**: Enable network policies for pod communication
2. **RBAC**: Use service accounts with minimal permissions
3. **Secrets Management**: Use Kubernetes secrets for sensitive data
4. **Image Security**: Use signed images and scan for vulnerabilities
5. **Ingress TLS**: Enable TLS termination at ingress level

## Performance Optimization

1. **Resource Limits**: Set appropriate CPU and memory limits
2. **Autoscaling**: Configure HPA based on metrics
3. **Node Affinity**: Use node affinity for better performance
4. **Caching**: Enable application-level caching
5. **Database Optimization**: Tune database connections and queries

## Maintenance

### Rolling Updates

```bash
# Perform rolling update
helm upgrade callstack ./infra/helm/callstack \
  --namespace callstack \
  --values ./infra/helm/callstack/values.yaml \
  --set image.tag=v1.1.0
```

### Canary Deployments

```bash
# Deploy canary
helm upgrade callstack ./infra/helm/callstack \
  --namespace callstack \
  --set canary.enabled=true \
  --set canary.traffic=10
```

This deployment automation provides a robust, scalable, and maintainable way to deploy the CallStack VoIP platform to Kubernetes environments.