import globby from 'globby';
import webpack from 'webpack';
import path from 'path';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import CleanWebpackPlugin from 'clean-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import StylelintWebpackPlugin from 'stylelint-webpack-plugin';

const ENV = process.env.NODE_ENV || 'development';
const DEV = ENV === 'development';
const PROD = ENV === 'production';

const makeWebpackConfig = () => {
  const scripts = globby.sync(['app/scripts/*.js']);

  const webpackConfig = {
    entry: scripts.reduce((entry, script) => {
      let name = path.basename(script, '.js');
      entry[name] = PROD
        ? path.join(__dirname, script)
        : ['webpack-hot-middleware/client?reload=true&quiet=true', path.join(__dirname, script)];
      return entry;
    }, {}),
    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[name].js',
      chunkFilename: '[name].chunk.js',
      hashDigestLength: 32,
      publicPath: DEV ? '/' : '/color-name/'
    },
    resolve: {
      root: path.join(__dirname, 'app'),
      modulesDirectories: ['node_modules', 'bower_components'],
      extensions: ['', '.js']
    },
    module: {
      preLoaders: [
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          loader: 'eslint-loader'
        }
      ],
      loaders: [
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          loader: 'babel-loader'
        },
        {
          test: /\.json$/,
          loader: 'json-loader'
        },
        {
          test: /\.css$/,
          loader: PROD
            ? ExtractTextPlugin.extract('style-loader', 'css-loader!postcss-loader')
            : 'style-loader!css-loader!postcss-loader'
        },
        {
          test: /\.scss$/,
          loader: PROD
            ? ExtractTextPlugin.extract('style-loader', 'css-loader!postcss-loader!sass-loader')
            : 'style-loader!css-loader!postcss-loader!sass-loader'
        },
        {
          test: /\.(png|jpg|gif|swf)$/,
          loader: 'file-loader?name=[name].[ext]'
        },
        {
          test: /\.(ttf|eot|svg|woff(2)?)(\S+)?$/,
          loader: 'file-loader?name=[name].[ext]'
        },
        {
          test: /\.html$/,
          loader: 'html-loader?interpolate'
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(ENV)
        }
      }),
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery'
      }),
      new StylelintWebpackPlugin({
        files: '**/*.?(s)@(a|c)ss',
        configFile: path.join(__dirname, '.stylelintrc'),
        failOnError: PROD
      })
    ],
    eslint: {
      configFile: path.join(__dirname, '.eslintrc'),
      failOnError: PROD,
      emitError: PROD
    },
    postcss: () => {
      let processors = [
        autoprefixer({
          browsers: [
            'ie >= 10',
            'ie_mob >= 10',
            'ff >= 30',
            'chrome >= 34',
            'safari >= 7',
            'opera >= 23',
            'ios >= 7',
            'android >= 4.4',
            'bb >= 10'
          ]
        })
      ];
      if (PROD) {
        processors.push(cssnano({
          safe: true,
          discardComments: {
            removeAll: true
          }
        }));
      }
      return processors;
    },
    sassLoader: {
      includePaths: [
        path.join(__dirname, 'bower_components'),
        path.join(__dirname, 'node_modules')
      ],
      outputStyle: PROD ? 'compressed' : 'expanded'
    },
    node: {
      net: 'mock',
      dns: 'mock'
    },
    debug: DEV,
    devtool: DEV ? '#eval' : false,
    stats: {
      children: false
    }
  };

  const templates = globby.sync(['app/*.html']);
  templates.forEach(template => {
    let basename = path.basename(template, '.html');
    let chunks = PROD ? ['common'] : [];
    chunks.push(basename);
    webpackConfig.plugins.push(new HtmlWebpackPlugin({
      filename: basename + '.html',
      template: path.join(__dirname, template),
      chunks: chunks
    }));
  });

  if (DEV) {
    webpackConfig.plugins = webpackConfig.plugins.concat([
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoErrorsPlugin()
    ]);
  }

  if (PROD) {
    webpackConfig.plugins = webpackConfig.plugins.concat([
      new CleanWebpackPlugin(['dist'], {
        verbose: false
      }),
      new FaviconsWebpackPlugin({
        logo: path.join(__dirname, 'app/images/logo.png'),
        prefix: 'favicons/'
      }),
      new ExtractTextPlugin('[name].css'),
      new webpack.optimize.CommonsChunkPlugin({
        name: 'common',
        filename: 'common.js'
      }),
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: false,
        compress: {
          warnings: false
        },
        output: {
          comments: false
        }
      }),
      new webpack.optimize.DedupePlugin()
    ]);
  }
  return webpackConfig;
};

const defaultWebpackConfig = makeWebpackConfig();

export {makeWebpackConfig};
export default defaultWebpackConfig;

