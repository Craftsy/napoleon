var gulp = require('gulp');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var mocha = require('gulp-mocha');

gulp.task('default', function(){
    var stream = gulp.src('src/napoleon.js')
        .pipe(babel({
            loose: ['es6.classes', 'es6.destructuring', 'es6.spread'],
            modules: 'umd'
        }))
        .pipe(uglify())
        .pipe(gulp.dest('build'));
    return stream;
});

gulp.task('build-tests', ['default'], function(){
    var stream = gulp.src('tests/*.js')
        .pipe(babel({
            loose: ['es6.classes', 'es6.destructuring', 'es6.spread'],
            modules: 'umd'
        }))
        .pipe(gulp.dest('build/tests'));
    return stream;
});

gulp.task('run-tests', ['build-tests'], function(){
    var stream = gulp.src('build/tests/*.js', {read: false})
    .pipe(mocha({reporter: 'nyan'}));
    return stream;
});

gulp.task('test', ['run-tests']);
