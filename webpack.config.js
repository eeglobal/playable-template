const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const ExternalResourcesInlinePlugin = require('./plugins/ExternalResourcesInlinePlugin');

class InlineAssetsPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('InlineAssetsPlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        'InlineAssetsPlugin',
        (data, cb) => {
          try {
            let html = data.html;
            
            // Get all CSS files from compilation assets
            const cssFiles = Object.keys(compilation.assets).filter(file => file.endsWith('.css'));
            
            cssFiles.forEach(cssFile => {
              const cssContent = compilation.assets[cssFile];
              if (cssContent) {
                const cssSource = cssContent.source();
                // Replace CSS link tags with inline styles
                const linkRegex = new RegExp(`<link[^>]*href=["\'][^"']*${cssFile}["\'][^>]*>`, 'g');
                html = html.replace(linkRegex, `<style>${cssSource}</style>`);
                
                // Remove CSS file from assets so it's not output separately
                delete compilation.assets[cssFile];
              }
            });
            
            data.html = html;
            cb(null, data);
          } catch (error) {
            cb(error);
          }
        }
      );
    });
  }
}

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
    // Ensure all assets are inlined, no separate files
    assetModuleFilename: 'data:[contenthash][ext]'
  },
  module: {
    rules: [
      // JavaScript/JSX
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules\/(?!(some-package-to-transpile)\/).*/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      // CSS from any source (including node_modules)
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      // SCSS/SASS from any source
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
      // Images - inline as base64 (including from node_modules)
      {
        test: /\.(png|jpe?g|gif|svg|webp|ico)$/i,
        type: 'asset/inline',
        parser: {
          dataUrlCondition: {
            maxSize: 50 * 1024 * 1024 // 50MB - very large limit to ensure inlining
          }
        }
      },
      // Fonts - inline as base64 (including from node_modules)
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/inline',
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024 * 1024 // 10MB for fonts
          }
        }
      },
      // Other assets - inline (including from node_modules)
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
        type: 'asset/inline',
        parser: {
          dataUrlCondition: {
            maxSize: 100 * 1024 * 1024 // 100MB for media files
          }
        }
      },
      // JSON files (some npm packages include JSON assets)
      {
        test: /\.json$/i,
        type: 'asset/inline',
      },
      // Text files (some packages include .txt, .md files)
      {
        test: /\.(txt|md)$/i,
        type: 'asset/inline',
      },
      // HTML template processing for images
      {
        test: /\.html$/i,
        use: [
          {
            loader: 'html-loader',
            options: {
              sources: {
                list: [
                  {
                    tag: 'img',
                    attribute: 'src',
                    type: 'src',
                  },
                  {
                    tag: 'gwd-image',
                    attribute: 'source',
                    type: 'src',
                  },
                  {
                    tag: 'img',
                    attribute: 'data-src',
                    type: 'src',
                  },
                  {
                    tag: 'link',
                    attribute: 'href',
                    type: 'src',
                    filter: (tag, attribute, attributes) => {
                      return attributes.rel && attributes.rel.includes('icon');
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new ExternalResourcesInlinePlugin({}),
    new MiniCssExtractPlugin({
      filename: 'styles.[contenthash].css',
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'body',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
    new HtmlInlineScriptPlugin(),
    new InlineAssetsPlugin(),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
      new CssMinimizerPlugin(),
    ],
    // Force everything into a single chunk to ensure complete inlining
    splitChunks: {
      chunks: 'all',
      minSize: 0,
      cacheGroups: {
        default: {
          name: 'main',
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    // Help webpack find modules in node_modules
    modules: ['node_modules'],
    // Fallbacks for node.js modules (some packages might need these)
    fallback: {
      "fs": false,
      "path": false,
      "os": false,
    }
  },
  performance: {
    hints: false, // Disable warnings for large bundle size since we're inlining everything
  },
};