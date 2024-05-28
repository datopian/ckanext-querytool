const gulp = require('gulp');
const less = require('gulp-less');
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
// const sourcemaps = require('gulp-sourcemaps'); // Uncomment when developing

// Rebuild CSS from LESS in the main directory
function compileLessMain() {
  return gulp.src('ckanext/querytool/assets/less/*.less')
    // .pipe(sourcemaps.init()) // Uncomment when developing
    .pipe(less())
    .pipe(cleanCSS({
      compatibility: 'ie8'
    }))
    .pipe(autoprefixer({
      overrideBrowserslist: [
        "last 5 versions",
        "ie >= 11"
      ]
    }))
    // .pipe(sourcemaps.write()) // Uncomment when developing
    .pipe(gulp.dest('ckanext/querytool/assets/css'));
}

// Rebuild CSS from LESS in the inc directory
function compileLessInc() {
  return gulp.src('ckanext/querytool/assets/less/inc/*.less')
    // .pipe(sourcemaps.init()) // Uncomment when developing
    .pipe(less())
    .pipe(cleanCSS({
      compatibility: 'ie8'
    }))
    .pipe(autoprefixer({
      overrideBrowserslist: [
        "last 5 versions",
        "ie >= 11"
      ]
    }))
    // .pipe(sourcemaps.write()) // Uncomment when developing
    .pipe(gulp.dest('ckanext/querytool/assets/css/inc'));
}

// Watch for LESS file changes
function watchFiles() {
  gulp.watch('ckanext/querytool/assets/less/*.less', compileLessMain);
  gulp.watch('ckanext/querytool/assets/less/inc/*.less', compileLessInc);
}

// Define complex tasks
const build = gulp.series(gulp.parallel(compileLessMain, compileLessInc), watchFiles);

// Export tasks
exports.compileLessMain = compileLessMain;
exports.compileLessInc = compileLessInc;
exports.watch = watchFiles;
exports.default = build;
