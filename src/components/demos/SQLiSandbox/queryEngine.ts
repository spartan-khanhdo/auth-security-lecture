/**
 * Client-only SQL "engine" that returns canned results for known injection shapes.
 * This is a simulation for educational purposes — no real DB is involved.
 */

export interface UserRow {
  id: number;
  username: string;
  email: string;
  role: string;
  password_hash: string;
}

const USERS_TABLE: UserRow[] = [
  { id: 1, username: "alice",  email: "alice@bank.example",  role: "admin",    password_hash: "$2b$10$hash1..." },
  { id: 2, username: "bob",    email: "bob@bank.example",    role: "teller",   password_hash: "$2b$10$hash2..." },
  { id: 3, username: "carol",  email: "carol@bank.example",  role: "customer", password_hash: "$2b$10$hash3..." },
  { id: 4, username: "dave",   email: "dave@bank.example",   role: "customer", password_hash: "$2b$10$hash4..." },
];

export interface QueryResult {
  sql: string;
  rows: UserRow[];
  error: string | null;
  injected: boolean;
}

/**
 * Simulates a vulnerable SQL query built with string concatenation.
 * Detects common injection patterns and returns the "full table leak" result.
 */
export function vulnerableQuery(username: string, password: string): QueryResult {
  const sql = `SELECT * FROM users WHERE username='${username}' AND password_hash='${password}'`;

  // Common injection patterns
  const lower = username.toLowerCase() + " " + password.toLowerCase();
  const isInjection =
    lower.includes("' or ") ||
    lower.includes("' or'") ||
    lower.includes("1=1") ||
    lower.includes("--") ||
    lower.includes("/*") ||
    lower.includes("union") ||
    lower.includes("drop") ||
    lower.includes("';");

  if (isInjection) {
    return { sql, rows: USERS_TABLE, error: null, injected: true };
  }

  // Normal query: find exact match
  const matched = USERS_TABLE.find((u) => u.username === username);
  if (matched) {
    return { sql, rows: [matched], error: null, injected: false };
  }

  return { sql, rows: [], error: null, injected: false };
}

/**
 * Simulates a parameterized query — injection strings are treated as literals.
 */
export function parameterizedQuery(username: string, password: string): QueryResult {
  const sql = `SELECT * FROM users WHERE username = $1 AND password_hash = $2\n-- Parameters: ['${username}', '${password}']`;

  // Parameterized: exact literal match only, no injection possible
  const matched = USERS_TABLE.find((u) => u.username === username);
  if (matched) {
    return { sql, rows: [matched], error: null, injected: false };
  }

  return { sql, rows: [], error: null, injected: false };
}
