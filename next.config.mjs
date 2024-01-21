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
  };
  
  export default nextConfig;
  