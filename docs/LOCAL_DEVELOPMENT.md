# Local Development Guide

This guide provides instructions on how to run, access, and test the DocuMesh Platform locally.

## 🚀 Running the Environment

1.  **Start Infrastructure**: Ensure Docker is running and start the backing services (Postgres, Redis, LocalStack).

    ```bash
    docker-compose up -d
    ```

2.  **Install Dependencies**:

    ```bash
    bun install
    ```

3.  **Setup Database**:

    ```bash
    # Push schema to database
    bun run db:push

    # Seed security data (Test Org & API Key)
    bun run db:seed

    # Seed test user (Admin)
    bun run db:seed-user
    ```

4.  **Setup S3 (LocalStack)**:

    The S3 bucket (`documesh-local`) and CORS configuration are automatically applied when the container starts via `infrastructure/localstack/init-s3.sh`.

    If you need to manually re-apply the configuration (e.g., after clearing volumes without restarting containers):

    ```bash
    bun run s3:setup
    ```

5.  **Start Application**:
    ```bash
    bun run dev
    ```
    This command starts the Web App, API, and Worker simultaneously using Turbo.

---

## 🔑 Access & Credentials

### Web Application

- **URL**: [http://localhost:3000](http://localhost:3000)
- **Login Credentials**:
  - **Email**: `admin@documesh.com`
  - **Password**: `password123`

### Public API

- **URL**: [http://localhost:3001](http://localhost:3001)
- **Test Organization API Key**: `sk_test_12345`

---

## 🧪 How to Test

### 1. Web Dashboard (Human Flow)

1.  Navigate to [http://localhost:3000/login](http://localhost:3000/login).
2.  Sign in with the credentials above.
3.  On the Dashboard:
    - **Upload**: Click **"Upload PDF"** to select a file, or drag and drop a PDF file into the zone.
    - **Process**: The file is uploaded to LocalStack S3. The Worker picks up the job.
    - **View**: The dashboard updates in real-time (refresh if needed) to show the status changing from `pending` -> `processing` -> `completed`.
    - **Inspect**: Click on a completed submission to view the extracted data.

### 2. API Access (Machine Flow)

You can interact with the API using `curl` or Postman.

**Health Check:**

```bash
curl http://localhost:3001/health \
  -H "x-api-key: sk_test_12345"
```

**Upload Document (via API):**
_(Note: Full API upload flow requires implementing the presigned URL exchange, which is currently handled by the Web App's Server Actions. The API is primarily for status checks and data retrieval in this version.)_

---

## 🛠️ Troubleshooting

- **Port Conflicts**: Ensure ports `3000` (Web), `3001` (API), `5432` (DB), `6379` (Redis), and `4566` (LocalStack) are free.
- **Database Issues**: If you encounter DB errors, try resetting:
  ```bash
  bun run db:reset
  bun run db:push
  bun run db:seed
  bun run --filter @repo/database db:seed-user
  ```
- **VS Code Import Error**: If you see errors in IDE, make sure to not exclude `node_modules` in your settings.
- **S3 Upload Errors**: If you see "Network Error" or CORS issues during upload:
  1. Ensure LocalStack is running (`docker ps`).
  2. Run `bun run s3:setup` to re-apply CORS rules.
  3. Ensure your browser can reach `http://127.0.0.1:4566`.
