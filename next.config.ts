import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // O Dockerfile define DOCKER_BUILD=1 para gerar a saída standalone (server.js autônomo).
  // Localmente o build padrão permite `npm start` sem avisos.
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['mysql2'],
};

export default nextConfig;
