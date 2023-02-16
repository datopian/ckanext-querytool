const path = require('path');
const assetPath = './ckanext/querytool/fanstatic/javascript';
require('@babel/polyfill')

module.exports = {
  devtool: "source-map",
  context: path.resolve(__dirname),
	entry: {
    "public_query": `${assetPath}/public_query.js`,
    "visualizations_settings": `${assetPath}/visualizations_settings.js`,
    "querytool_data": `${assetPath}/querytool_data.js`,
    "querytool_list": `${assetPath}/querytool_list.js`,
    "modules/viz-preview": `${assetPath}/modules/viz-preview.js`,
    "modules/civic_cookies": `${assetPath}/modules/civic_cookies.js`,
    "modules/table-module": `${assetPath}/modules/table-module.js`,
    "modules/map-module": `${assetPath}/modules/map-module.js`,
    "modules/tool-embed": `${assetPath}/modules/tool-embed.js`,
    "modules/export-to-png": `${assetPath}/modules/export-to-png.js`,
  },
	output: {
		path: path.resolve(__dirname, assetPath, 'dist')
	},
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  }
};
