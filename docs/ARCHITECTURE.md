# Master Architectural Reference

**Scope:** Infrastructure Topology, Network Security, and Deployment Strategy.

## 1. The Agile Monolith Pattern

We deploy logical microservices (Web, API, Worker) as a physical monolith to minimize "Ops Tax."

- **Shared Cluster:** All services run on a single ECS Fargate Cluster per environment.
- **Shared Load Balancer:** A single ALB routes traffic based on Host Headers.
  - `admin.documesh.com` → Admin Container (WAF Protected)
  - `api.documesh.com` → API Container (Middleware Protected)
  - `app.documesh.com` → Web Container

## 2. Network Topology (The 2-VPC Model)

To mitigate the risk of Terraform state collisions or human error destroying production data, we enforce physical network isolation.

### VPC A: Non-Prod (10.10.0.0/16)

- **Environments:** `Dev` and `Staging`.
- **Cost Optimization:** Uses a **Single Shared NAT Gateway** ($32/mo) across all non-prod environments.
- **Database:** Logical Databases (`db_dev`, `db_staging`) on a shared RDS Instance.

### VPC B: Production (10.20.0.0/16)

- **Environments:** `Prod`.
- **Isolation:** Dedicated NAT Gateway. Dedicated RDS Instance. Separate Terraform State file.
- **Security:** No network route exists between VPC A and VPC B.

## 3. Layered Security Architecture

| Layer       | Mechanism           | Target Threat             | Implementation                                                                 |
| :---------- | :------------------ | :------------------------ | :----------------------------------------------------------------------------- |
| **Edge**    | **AWS WAF**         | Unauthorized Admin Access | Static IP Set (Office/VPN) blocks `admin.*` requests at the ALB.               |
| **App**     | **Hono Middleware** | Tenant Data Leakage       | Checks API Key & validates Client IP against `organization.allowed_ips` in DB. |
| **Network** | **Private Subnets** | Direct Attack             | Containers have no Public IPs. Outbound access is strictly via NAT.            |

## 4. Configuration & Secrets

We utilize **AWS SSM Parameter Store** as the Single Source of Truth.

- **Definition:** Terraform manages the _existence_ of parameters but ignores their _values_.
- **Injection:** ECS Agent injects SSM parameters as Environment Variables at container startup.
- **Local Dev:** Developers use `dotenv-cli` to cascade configurations:
  - `bun run dev` → Localhost.
  - `bun run dev:dev` → Connects to Remote Dev Infrastructure via Tailscale.
