const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true
})
module.exports = {
  lintOnSave: false,
  chainWebpack: config => {
    config.module
        .rule('ts')
        .use('ts-loader')
        .loader('ts-loader')
        .tap(options => {
          options.transpileOnly = true;  // 禁用类型检查
          return options;
        });

    config.module
        .rule('tsx')
        .use('ts-loader')
        .loader('ts-loader')
        .tap(options => {
          options.transpileOnly = true;  // 禁用类型检查
          return options;
        });
  },
  devServer: {
    proxy: {
      '/api': {
        target: 'http://10.41.24.204:5000',
        changeOrigin: true
      }
    }
  }
}
