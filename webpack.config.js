const path = require('path');
const assetPath = './ckanext/querytool/fanstatic/javascript';
require('@babel/polyfill')

module.exports = {
  devtool: "source-map",
  context: path.resolve(__dirname),
	entry: {
    "public_query": `${assetPath}/public_query.js`,
    "visualizations_settings": `${assetPath}/visualizations_settings.js`,
    "modules/viz-preview": `${assetPath}/modules/viz-preview.js`,
    "modules/table-module": `${assetPath}/modules/table-module.js`
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
