'use strict';

const GAME_SCALE = 4;

var gulp = require('gulp');
var gutil = require('gulp-util');

var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var jsonTransform = require('gulp-json-transform');

var browserSync = require('browser-sync').create();
var del = require('del');
var merge = require('merge-stream');
var rename = require('gulp-rename');


// IMPORTANT
// edit gulp.config.json and customize there your deployment settings
var rsync = require('gulp-rsync');
var config = {};
try {
    config = require('./gulp.config.json');
}
catch (e) {
    console.warn('Edit or create gulp.config.json to customize your ' +
        'deployment settings.');
}

var ghpages = require('gulp-gh-pages');


//
// browserify and js
//

var bundler = browserify([
    './src/js/main.js'
]);

var bundle = function ()  {
    return bundler
    .bundle()
    .on('error', gutil.log)
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('.tmp/js/'))
    .pipe(browserSync.stream({once: true}));
};


gulp.task('browserify', bundle);

// 3rd party libs that don't play nice with browserify
gulp.task('libs', function () {
    var dir = './node_modules/phaser/build/';
    return gulp.src(['phaser.min.js', 'phaser.map'], { cwd: dir, base: dir})
    .pipe(gulp.dest('./.tmp/js/lib/'));
});

gulp.task('js', ['browserify', 'libs']);

//
// game-related builds
//

gulp.task('build:maps', function () {
    gulp.src('src/data/*.json')
        .pipe(jsonTransform(function (data) {
            return {
                width: data.tileswide,
                height: data.tileshigh,
                tilewidth: data.tilewidth * GAME_SCALE,
                tileheight: data.tileheight * GAME_SCALE,
                layers: data.layers.filter(x => x !== null).map(function (l) {
                    return {
                        data: l.tiles.map(x => x.tile === 0 ? -1 : x.tile),
                        name: l.name
                    };
                })
            };
        }), 2)
        .pipe(rename({
            suffix: '.min',
            extname: '.json'
        }))
        .pipe(gulp.dest('./.tmp/data/'))
    .on('error', gutil.log);
});

//
// build and deploy
//

gulp.task('build', ['js', 'build:maps']);

gulp.task('dist', ['build'], function () {
    var rawFiles = gulp.src([
        'index.html', 'raw.html',
        'styles.css', 'fs-icon.svg',
        'images/**/*', 'fonts/**/*', 'audio/**/*'
    ], { cwd: './src', base: './src' })
    .pipe(gulp.dest('./dist/'));

    var builtFiles = gulp.src([
        'js/**/*', 'data/**/*'
    ], { cwd: '.tmp', base: '.tmp' })
    .pipe(gulp.dest('./dist/'));

    return merge(rawFiles, builtFiles);
});

gulp.task('clean', function () {
    return del(['.tmp', 'dist', '.publish']);
});


gulp.task('deploy:rsync', ['dist'], function () {
    return gulp.src('dist')
    .pipe(rsync({
        root: 'dist',
        username: config.deploy.user,
        hostname: config.deploy.host,
        destination: config.deploy.destination,
        recursive: true,
        clean: true,
        progress: true,
        incremental: true
    }));
});

gulp.task('deploy:ghpages', ['dist'], function () {
    return gulp.src('dist/**/*')
    .pipe(ghpages());
});


//
// dev tasks
//

gulp.task('watch', function () {
    bundler = watchify(bundler, watchify.args);
    bundler.on('update', bundle);
});

gulp.task('run', ['watch', 'build'], function () {
    browserSync.init({
        server: ['src', '.tmp']
    });

    gulp.watch('src/**/*.{html,css}').on('change', browserSync.reload);
});

//
// default task
//

gulp.task('default', ['dist']);
