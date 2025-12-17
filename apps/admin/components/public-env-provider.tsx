import { env } from "@repo/config";

export function PublicEnvProvider() {
  const publicEnv = {
    NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_AUTH_URL: env.NEXT_PUBLIC_AUTH_URL,
  };

  const scriptContent = `
    window.__ENV = ${JSON.stringify(publicEnv)};
  `;

  return (
    <script
      id="public-env"
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  );
}
