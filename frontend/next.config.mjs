// frontend/next.config.mjs
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 1) Try to load a user config only if it actually exists
let userConfig = {};
const userConfigPath = resolve(__dirname, "v0-user-next.config.js");
if (existsSync(userConfigPath)) {
  // note the “.js” extension!
  const mod = await import(userConfigPath);
  userConfig = mod.default ?? mod;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: "http://localhost:5000/api/:path*" }];
  },

  webpack(config, { isServer }) {
    // Don’t bundle undici in client builds
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, undici: false };
    } else {
      // Externals for server build
      config.externals = [...config.externals, "undici"];
    }

    // Stub out the util.js file that Webpack can’t parse
    config.module.rules.push({
      test: /node_modules[\\/]undici[\\/]lib[\\/]web[\\/]fetch[\\/]util\.js$/,
      use: "null-loader",
    });

    return config;
  },

};

// shallow merge any user config on top
function mergeConfig(base, extra) {
  if (!extra) return;
  for (const key in extra) {
    if (typeof base[key] === "object" && !Array.isArray(base[key])) {
      base[key] = { ...base[key], ...extra[key] };
    } else {
      base[key] = extra[key];
    }
  }
}

mergeConfig(nextConfig, userConfig);

export default nextConfig;
