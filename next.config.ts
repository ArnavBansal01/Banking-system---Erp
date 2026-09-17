import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep DuckDB native bindings server-only — never bundled for the browser
  serverExternalPackages: ["duckdb", "duckdb-async"],

  // Preserve existing path aliases from tsconfig
  // @/* → ./src/*  and  ~/* → ./app/*  are handled via tsconfig paths
};

export default nextConfig;
