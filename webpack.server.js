import browserSync from 'browser-sync';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import {makeWebpackConfig} from './webpack.config.babel';
import chokidar from 'chokidar';
import path from 'path';

const getWebpackMiddleware = () => {
  let webpackConfig = makeWebpackConfig();
  let compiler = webpack(webpackConfig);
  let webpackDevMiddlewareInstance = webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath,
    stats: {
      colors: true,
      hash: false,
      timings: false,
      chunks: false,
      chunkModules: false,
      modules: false,
      children: false,
      version: false,
      cached: false,
      cachedAssets: false,
      reasons: false,
      source: false,
      errorDetails: false
    }
  });
  let webpackHotMiddlewareInstance = webpackHotMiddleware(compiler);
  return {webpackDevMiddlewareInstance, webpackHotMiddlewareInstance};
};

const reloadMiddleware = (bs) => {
  let webpackMiddleware = getWebpackMiddleware();
  let reloaded = false;
  webpackMiddleware.webpackDevMiddlewareInstance.waitUntilValid(() => {
    if (!reloaded) {
      browserSync.reload();
      reloaded = true;
    }
  });
  bs.app.stack.forEach(middleware => {
    if (middleware.id === 'webpackDevMiddleware') {
      middleware.handle.close();
      middleware.handle = webpackMiddleware.webpackDevMiddlewareInstance;
    } else if (middleware.id === 'webpackHotMiddleware') {
      middleware.handle = webpackMiddleware.webpackHotMiddlewareInstance;
    }
  });
};

const webpackMiddleware = getWebpackMiddleware();

browserSync({
  server: {
    baseDir: 'app'
  },
  middleware: [
    {
      id: 'webpackDevMiddleware',
      route: '',
      handle: webpackMiddleware.webpackDevMiddlewareInstance
    },
    {
      id: 'webpackHotMiddleware',
      route: '',
      handle: webpackMiddleware.webpackHotMiddlewareInstance
    }
  ]
}, (error, bs) => {
  if (error) {
    console.error(error);
  }
  var watcher = chokidar.watch(['app/*.html', 'app/scripts/*.js'], {
    ignoreInitial: true
  });
  watcher.on('all', function (event, file) {
    if (event !== 'change') {
      reloadMiddleware(bs);
    } else if (path.extname(file) === '.html') {
      browserSync.reload();
    }
  });
});
