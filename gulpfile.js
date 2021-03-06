"use strict";

const { series, parallel, src, dest, watch } = require("gulp");
const pug = require("gulp-pug");
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const csso = require("gulp-csso");
const webpackStream = require("webpack-stream");
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const rename = require("gulp-rename");
const del = require("del");
const browserSync = require("browser-sync").create();

const root = {
  src: "src/",
  build: "dist/",
};

const path = {
  build: {
    html: root.build,
    css: root.build + "styles/",
    js: root.build + "scripts/",
  },
};

function clearBuildDir() {
  return del([
    "build/**",
    "!build",
    "!build/fonts",
    "!build/fonts/**",
    "!build/images",
    "!build/images/**",
    "!build/favicon",
    "!build/favicon/**",
  ]);
}
exports.clearBuildDir = clearBuildDir;

function compilePug() {
  return src([
    `${root.src}pages/**/*.pug`,
    `!${root.src}pages/**/*.data.pug`
  ])
    .pipe(
      plumber({
        errorHandler: notify.onError({
          title: "Ошибка PUG",
          message: "Error: <%= error.message %>",
        }),
      })
    )
    .pipe(
      pug({
        pretty: true,
      })
    )
    .pipe(
      rename({
        dirname: "",
      })
    )
    .pipe(dest(path.build.html))
    .pipe(browserSync.stream());
}
exports.compilePug = compilePug;

function compileSass() {
  return src(`${root.src}pages/**/*.sass`)
    .pipe(
      plumber({
        errorHandler: notify.onError({
          title: "Ошибка sass",
          message: "Error: <%= error.message %>",
        }),
      })
    )
    .pipe(sass())
    .pipe(
      autoprefixer({
        cascade: false,
      })
    )
    .pipe(
      csso({
        comments: false,
        restructure: false,
      })
    )
    .pipe(
      rename({
        dirname: "",
        suffix: ".min",
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browserSync.stream());
}
exports.compilesass = compileSass;

function buildJs() {
  return src([
    `./${root.src}pages/index/index.js`
  ])
    .pipe(
      plumber({
        errorHandler: notify.onError({
          title: "Ошибка JS",
          message: "Error: <%= error.message %>",
        }),
      })
    )
    .pipe(
      webpackStream({
        entry: {
          index: `./${root.src}pages/index/index.js`,
        },
        mode: "production",
        output: {
          filename: "[name].min.js",
        },
        module: {
          rules: [
            {
              test: /\.(js)$/,
              exclude: /(node_modules)/,
              loader: "babel-loader",
              query: {
                presets: ["@babel/preset-env"],
              },
            },
          ],
        },

        // Если используем jQuery
        // externals: {
        //     jquery: 'jQuery'
        // }
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browserSync.stream());
}
exports.buildJs = buildJs;

function reload(done) {
  browserSync.reload();
  done();
}

function serve() {
  browserSync.init(null, {
    server: root.build,
    cors: true,
    notify: false,
    port: 3000,
    startPath: "index.html",
    open: true,
  });

  // Следим за изменениями в файлах .pug
  watch(
    [
      `${root.src}layout/*.pug`,
      `${root.src}pages/**/*.pug`,
      `${root.src}components/**/*.pug`,
      `${root.src}theme/icons/*.pug`,
    ],
    {
      events: ["all"],
      delay: 100,
    },
    series(compilePug, reload)
  );

  // Следим за изменениями в файлах .sass
  watch(
    [
      `${root.src}layout/*.sass`,
      `${root.src}pages/**/*.sass`,
      `${root.src}libraries/**/**/*.sass`,
      `${root.src}components/**/*.sass`,
    ],
    {
      events: ["all"],
      delay: 100,
    },
    series(compileSass, reload)
  );

  // Следим за изменениями в файлах .js
  watch(
    [`${root.src}pages/**/*.js`, `${root.src}components/**/*.js`],
    {
      events: ["all"],
      delay: 100,
    },
    series(buildJs, reload)
  );
}

// Сборка: очитска дериктории, компиляция Pug, компиляция Sass, сборка Js
exports.build = series(
  clearBuildDir,
  parallel(compilePug, compileSass, buildJs)
);

// Сборка: очитска дериктории, компиляция Pug, компиляция Sass, сборка Js + запуск сервера и вотчера
exports.default = series(
  clearBuildDir,
  parallel(compilePug, compileSass, buildJs),
  serve
);
