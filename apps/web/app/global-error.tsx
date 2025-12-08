"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    // Global Error must include html and body tags
    <html>
      <body>
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          height: "100vh",
          fontFamily: "system-ui, sans-serif" 
        }}>
          <h2>Something went wrong!</h2>
          {/* Use a standard HTML button, NOT a shadcn Button component */}
          <button
            onClick={() => reset()}
            style={{
              padding: "10px 20px",
              marginTop: "20px",
              cursor: "pointer",
              background: "black",
              color: "white",
              border: "none",
              borderRadius: "4px"
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
