var gulp = require('gulp');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var mocha = require('gulp-mocha');

gulp.task('default', function(){
    gulp.src('src/Napoleon.js')
        .pipe(babel({
            loose: ['es6.classes', 'es6.destructuring', 'es6.spread'],
            modules: 'umd'
        }))
        //.pipe(uglify())
        .pipe(gulp.dest('build'));
});

gulp.task('build-tests', ['default'], function(){
    gulp.src('tests/*.js')
        .pipe(babel({
            loose: ['es6.classes', 'es6.destructuring', 'es6.spread'],
            modules: 'umd'
        }))
        .pipe(gulp.dest('build/tests'));
});

gulp.task('test', function(){
    gulp.src('build/tests/*.js', {read: false})
    .pipe(mocha({reporter: 'nyan'}));
});