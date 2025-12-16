# Local Auth & Feature Validation Workflow

Use this workflow to authenticate into the local web application and validate implemented features using Playwright.

## 1. Sign In (Standard Flow)

Use the Playwright MCP tools to perform the login.

1.  **Navigate to Login Page**:
    Use `mcp_playwright_browser_navigate` to go to `http://localhost:3000/login`.

2.  **Fill Credentials**:
    Use `mcp_playwright_browser_fill_form` with:
    - **Email**: `admin@documesh.com`
    - **Password**: `password123`

    Alternatively, type them manually if the form tool is problematic:

    ```javascript
    await page
      .getByRole("textbox", { name: "Email address" })
      .fill("admin@documesh.com");
    await page.getByRole("textbox", { name: "Password" }).fill("password123");
    ```

3.  **Submit**:
    Click the "Sign in" button.

4.  **Verify Access**:
    Wait for the URL to change to `/dashboard` or for the text "DocuMesh" (or "Upload PDF") to appear.

## 2. Feature Validation

After signing in, proceed to validate the specific feature you implemented.

- **UI Changes**: Navigate to the specific page and take a screenshot (`mcp_playwright_browser_take_screenshot`).
- **User Flows**: Perform the actions (Click, Fill, Upload) that a user would take.
- **Uploads**: If validating uploads, use `mcp_playwright_browser_evaluate` or `run_code` to handle file inputs, as standard clicks may not work for hidden file inputs.

## 3. Troubleshooting

- **WSL2 Issues**: If `browser_subagent` fails with connection errors, strictly use the `mcp_playwright_*` tools directly. They run in a way that is compatible with the WSL2 environment.
- **Screenshots**: Always take a screenshot at the end of your validation to visually confirm the state.
