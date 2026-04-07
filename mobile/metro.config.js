const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure Metro to work with network access
config.server = {
  ...config.server,
  // Allow connections from any IP address
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Set CORS headers to allow cross-origin requests from any network
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }
      
      return middleware(req, res, next);
    };
  },
};

// Additional network configuration for better cross-network compatibility
config.resolver = {
  ...config.resolver,
  // Ensure proper resolution across different networks
  platforms: ['ios', 'android', 'native', 'web'],
  // Add source extensions for better module resolution
  sourceExts: [...(config.resolver?.sourceExts || []), 'cjs', 'mjs'],
};

module.exports = config;
