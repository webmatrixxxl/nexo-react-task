// const CracoAntDesignPlugin = require('craco-antd');
const path = require('path');

module.exports = ({ env }) => {
  return {
    devServer: {
      proxy: {
        ['/bitfinex/']: {
          target: 'https://api.bitfinex.com/v1',
          pathRewrite: { [`^/bitfinex`]: '' },
          changeOrigin: true,
        },
        ['/kraken/']: {
          target: 'https://api.kraken.com/0/public/',
          pathRewrite: { [`^/kraken`]: '' },
          changeOrigin: true,
        },
      },
      // plugins: [
      //   {
      //     plugin: CracoAntDesignPlugin,
      //     options: {
      //       customizeThemeLessPath: path.join(
      //         __dirname,
      //         'src/assets/style/AntDesign/customTheme.less'
      //       ),
      //     },
      //   },
      // ],
    },
  };
};
