/**
 * @File   : webpack.dev.config.js
 * @Author : dtysky(dtysky@outlook.com)
 * @Date   : 2018-06-20T16:00:00.000Z
 * @Description: 
 */
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    main: [
      'react-hot-loader/patch',
      'webpack-dev-server/client?/',
      'webpack/hot/dev-server',
      path.resolve(__dirname, './demo/index.tsx')
    ]
  },

  output: {
    path: path.resolve(__dirname),
    filename: 'main.js',
    publicPath: '/'
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },

  externals: {
    'fs': true,
    'path': true,
  },
  
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.tsx?$/,
        use: [
          {
            loader: 'react-hot-loader/webpack'
          },
          {
            loader: "awesome-typescript-loader"
          },
          {
            loader: 'tslint-loader',
            query: {
              configFile: path.resolve(__dirname, './tslintConfig.js')
            }
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.(css|scss)$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'postcss-loader'
          },
          {
            loader: 'sass-loader'
          }
        ]
      },
      {
        test: /\.md$/,
        use: [
          {
            loader: 'raw-loader'
          }
        ]
      },
      {
        test: /\.(png|jpg|gif|svg|mp4)$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 15000
          }
        }
      },
      {
        test: /\.json$/,
        use: {
          loader: 'json-loader'
        }
      }
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      NODE_ENV: JSON.stringify('development')
    }),
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: './demo/index.html'
    })
  ]
};
