var gulp = require('gulp');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');

gulp.task('default', function(){
    gulp.src('src/Napoleon.js')
    .pipe(babel({
            loose: ['es6.classes', 'es6.destructuring', 'es6.spread'],
            modules: 'amd'
        }))
    .pipe(uglify())
    .pipe(gulp.dest('build'));
});