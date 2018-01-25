var gulp = require('gulp');
var less = require('gulp-less');
var cleanCSS = require('gulp-clean-css');
var autoprefixer = require('gulp-autoprefixer');
// var sourcemaps = require('gulp-sourcemaps'); - Uncomment when developing

// The default Gulp.js task
gulp.task('default', ['less', 'watch']);

// Rebuild CSS from LESS
gulp.task('less', function () {
  return gulp.src('less/*.less')
    // .pipe(sourcemaps.init()) - Uncomment when developing
    .pipe(less())
    .pipe(cleanCSS({
      compatibility: 'ie8'
    }))
    .pipe(autoprefixer())
    // .pipe(sourcemaps.write()) - Uncomment when developing
    .pipe(gulp.dest('css'));
});

// Watch for LESS file changes
gulp.task('watch', function () {
  gulp.watch(['less/**/*.less'], ['less']);
});
