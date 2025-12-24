import type { NextConfig } from "next";
// QA
// const nextConfig: NextConfig = {
//   eslint: {
//     // Warning: This allows production builds to successfully complete even if
//     // your project has ESLint errors.
//     ignoreDuringBuilds: true,
//   },
//   typescript: {
//     // Warning: This allows production builds to successfully complete even if
//     // your project has type errors.
//     ignoreBuildErrors: true,
//   },
//   env: {
//     API_BASE_URL: 'https://multiple-nan-tecurb-5e2ba6a7.koyeb.app/',
//   },
// };

// DEV
const nextConfig: NextConfig = {
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://vps-5538614-x.dattaweb.com/qa/',
  },
};

export default nextConfig;
