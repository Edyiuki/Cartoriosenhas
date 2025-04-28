/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Desativar o modo estrito para evitar problemas com Socket.io
  swcMinify: true,
  webpack: (config) => {
    // Adicionar suporte para WebSockets no webpack
    config.externals.push({
      bufferutil: "bufferutil",
      "utf-8-validate": "utf-8-validate",
      "supports-color": "supports-color",
    });
    return config;
  },
  // Configurar headers para permitir WebSockets
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },
  // Configurar rewrites para o Socket.io
  async rewrites() {
    return [
      {
        source: "/socket.io/:path*",
        destination: "/api/socketio/:path*",
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
