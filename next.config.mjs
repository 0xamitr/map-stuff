const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add support for GeoJSON files using raw-loader
    config.module.rules.push({
      test: /\.(geojson)$/,
      use: {
        loader: 'raw-loader',
      },
    });

    return config;
  },
  async rewrites() {
    return [
      { source: '/high-speed-rail', destination: '/projects?category=high%20speed%20rail' },
      { source: '/expressway', destination: '/projects?category=expressway' },
      { source: '/metros', destination: '/projects?category=metros' },

      { source: '/high-speed-rail/:status', destination: '/projects?category=high%20speed%20rail&status=:status' },
      { source: '/expressway/:status', destination: '/projects?category=expressway&status=:status' },
      { source: '/metros/:status', destination: '/projects?category=metros&status=:status' },

      { source: '/groups/:slug', destination: '/projects?group=:slug' },
    ];
  },
};

export default nextConfig;
  