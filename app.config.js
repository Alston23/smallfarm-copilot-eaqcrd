
module.exports = ({ config }) => {
  return {
    ...config,
    web: {
      ...config.web,
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/final_quest_240x240.png',
      // GitHub Pages configuration
      build: {
        babel: {
          include: ['@expo/vector-icons']
        }
      }
    },
    extra: {
      ...config.extra,
      // Backend URL can be overridden via environment variable
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || 'https://8zg7gm9pb3edeprgzqzexfwtbq2w637s.app.specular.dev'
    }
  };
};
