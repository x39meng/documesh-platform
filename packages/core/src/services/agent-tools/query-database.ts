import { createLogger } from "@repo/core/lib/logger";
import { db } from "@repo/database";
import { sql } from "drizzle-orm";

const logger = createLogger("tool:query-database");

export async function handleQueryDatabase(
  args: any,
  orgId: string,
  requestId: string
) {
  logger.info({ args, orgId, requestId }, "Tool Call: queryDatabase");

  try {
    const { query } = args;

    // ═══════════════════════════════════════════════
    // LAYER 1: Input Validation
    // ═══════════════════════════════════════════════

    if (!query || typeof query !== "string") {
      return { error: "Invalid query parameter" };
    }

    if (query.length > 2000) {
      return { error: "Query too long. Maximum 2000 characters." };
    }

    const normalized = query.toLowerCase().trim();

    // ═══════════════════════════════════════════════
    // LAYER 2: Query Type Enforcement
    // ═══════════════════════════════════════════════

    // MUST start with SELECT (allowing for comments/whitespace)
    if (!normalized.match(/^\s*(\/\*.*?\*\/)?\s*select\b/)) {
      logger.warn({ query }, "Non-SELECT query rejected");
      return { error: "Only SELECT queries are allowed" };
    }

    // ═══════════════════════════════════════════════
    // LAYER 3: Comprehensive Blocklist
    // ═══════════════════════════════════════════════

    const blocklist = [
      // SQL Injection - strict substring match
      "--",
      "/*",
      "*/",
      "\\x",
      "char(",
      "chr(",

      // Dangerous Commands - require word boundary or space
      // These are regex patterns now
      /\binsert\b/i,
      /\bupdate\b/i,
      /\bdelete\b/i,
      /\bdrop\b/i,
      /\bcreate\b/i,
      /\balter\b/i,
      /\btruncate\b/i,
      /\breplace\b/i,
      /\bgrant\b/i,
      /\brevoke\b/i,
      /\bexec\b/i,
      /\bexecute\b/i,
      /\bcopy\b/i,
      /\bunion\b/i,
      /\bintersect\b/i,
      /\bexcept\b/i,
      /\bwith\b/i, // Block CTEs as they complicate scoping logic

      // Schema Discovery
      "information_schema",
      "pg_catalog",
      "pg_",
      "version(",

      // Other Dangerous
      "lo_import",
      "lo_export",
      "file_read",
      "file_write",
      "pg_sleep",
      "benchmark",
      "waitfor",
    ];

    for (const blocked of blocklist) {
      if (blocked instanceof RegExp) {
        if (blocked.test(normalized)) {
          logger.warn(
            { query, blocked: blocked.toString(), requestId },
            "Blocked keyword detected"
          );
          return { error: "Query contains prohibited syntax" };
        }
      } else if (normalized.includes(blocked)) {
        logger.warn({ query, blocked, requestId }, "Blocked keyword detected");
        return { error: "Query contains prohibited syntax" };
      }
    }

    // ═══════════════════════════════════════════════
    // LAYER 4: Table Whitelist
    // ═══════════════════════════════════════════════

    if (!normalized.includes("submissions")) {
      return { error: "Query must reference the submissions table" };
    }

    // Block queries to other tables
    const forbiddenTables = [
      "users",
      "sessions",
      "accounts",
      "memberships",
      "organizations",
      "verifications",
    ];

    for (const table of forbiddenTables) {
      if (normalized.includes(table)) {
        logger.warn(
          { query, table, requestId },
          "Forbidden table access attempt"
        );
        return { error: `Access to ${table} table is not allowed` };
      }
    }

    // ═══════════════════════════════════════════════
    // LAYER 5: Query Execution with Guards
    // ═══════════════════════════════════════════════

    // Set PostgreSQL session parameters for safety
    await db.execute(sql`SET statement_timeout = '5s'`);
    await db.execute(sql`SET work_mem = '64MB'`);

    // Add org scoping to the user's query
    // CRITICAL: This ensures org isolation by injecting WHERE clause
    // First, strip any trailing semicolons to prevent syntax errors
    let scopedQuery = query.trim().replace(/;+$/, "");

    // Check if query already has WHERE clause
    const hasWhere = /\bWHERE\b/i.test(scopedQuery);

    logger.info(
      {
        originalQuery: query,
        hasWhereClause: hasWhere,
        orgId,
        requestId,
      },
      "Processing database query"
    );

    if (hasWhere) {
      // Inject AND condition into existing WHERE clause
      // Find the WHERE clause and add our condition right after it
      scopedQuery = scopedQuery.replace(
        /(\bWHERE\b)/i,
        `WHERE org_id = '${orgId}' AND`
      );
    } else {
      // Add WHERE clause before any GROUP BY, ORDER BY, or LIMIT
      const beforeClauses = /\b(GROUP\s+BY|ORDER\s+BY|LIMIT|OFFSET)\b/i;
      const match = scopedQuery.match(beforeClauses);

      if (match && match.index !== undefined) {
        // Insert WHERE before the first clause
        scopedQuery =
          scopedQuery.substring(0, match.index) +
          ` WHERE org_id = '${orgId}' ` +
          scopedQuery.substring(match.index);
      } else {
        // No WHERE, GROUP BY, ORDER BY, or LIMIT - append at the end
        scopedQuery = `${scopedQuery} WHERE org_id = '${orgId}'`;
      }
    }

    // Add row limit as final safeguard
    // Only add if there's no existing LIMIT
    if (!/\bLIMIT\b/i.test(query)) {
      scopedQuery = `${scopedQuery} LIMIT 100`;
    }

    logger.info(
      {
        scopedQuery,
        transformationType: hasWhere ? "injected-and" : "added-where",
        requestId,
      },
      "Query transformed with org-scoping"
    );

    const startTime = Date.now();
    const results = await db.execute(sql.raw(scopedQuery));
    const duration = Date.now() - startTime;

    // Log slow queries for monitoring
    if (duration > 2000) {
      logger.warn({ query, duration, orgId, requestId }, "Slow query detected");
    }

    logger.info(
      {
        count: results.length,
        duration,
        orgId,
        requestId,
        resultSizeBytes: JSON.stringify(results).length,
      },
      "Tool Result: queryDatabase"
    );

    return { results: [...results], count: results.length };
  } catch (err: any) {
    logger.error(
      { err, query: args.query, orgId, requestId },
      "Query execution failed"
    );

    // ═══════════════════════════════════════════════
    // LAYER 6: Error Sanitization
    // ═══════════════════════════════════════════════

    // DO NOT leak schema details in errors
    if (
      err.message?.includes("column") ||
      err.message?.includes("table") ||
      err.message?.includes("syntax")
    ) {
      return { error: "Invalid query syntax. Please check your SQL." };
    }

    if (
      err.message?.includes("timeout") ||
      err.message?.includes("cancelled")
    ) {
      return {
        error: "Query execution timeout. Please simplify your query.",
      };
    }

    // Generic error for everything else
    return { error: "Query execution failed. Please try again." };
  }
}
