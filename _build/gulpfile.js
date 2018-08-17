/*global require*/

// Build variables
var appName = ''; // set by 'set-paths'
var releaseMode = false; // set by 'svn-version'
var revisionNo = ''; // set by 'svn-version'

var bases = {}; // set by 'set-paths'
var paths = {}; // set by 'set-paths'

var wrapBefore = ''; // set by 'set-paths'
var wrapAfter = ''; // set by 'set-paths'

// Plug-ins
var argv = require('yargs').argv;
var concat = require('gulp-concat');
var del = require('del');
var dependo = require('./dependo.js')
var gulp = require('gulp');
var gulpHandlebars = require('gulp-handlebars');
var gutil = require('gulp-util');
var handlebars = require('handlebars');
var livereload = require('gulp-livereload');
var Q = require('q');
var rename = require("gulp-rename");
var replace = require("gulp-replace");
var sass = require("gulp-sass");
var uglify = require('gulp-uglify');
var war = require('gulp-war');
var wrap = require('gulp-wrap');
var zip = require('gulp-zip');

// Node.js functions
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

// Specify build folder (containing gulpfile, buildbot, etc)
var buildFolder = path.join(process.cwd());
if (argv.buildFolder) {
	buildFolder = argv.buildFolder
} else {
	// Change to project directory from _build folder
	process.chdir('../');	
}

gutil.log('Working directory', process.cwd());

// Config from build.json
var buildJSON = require(path.join(process.cwd(), 'build'));
var projectName = buildJSON.name;
var warName = "dashboards";
var svnName = buildJSON.svnName;
var buildConfig = buildJSON.buildConfig;
var additionalSourceFiles = buildConfig.additionalSourceFiles || [];
var dependencies = buildConfig.localDependencies || [];
var outputCss = buildConfig.outputCss;
var outputFolder = buildConfig.outputFolder || 'apps';
var requireCss = buildConfig.requireCss || [];
var requireModules = buildConfig.requireModules || ['jqueryui'];
var sourceFolders = buildConfig.sourceFolders || { 'source': 'source' };

// Override the lookup semantics of handlebars to use object['property'] for closure advanced
handlebars.JavaScriptCompiler.prototype.nameLookup = function (parent, name, type) {
    if (/^[0-9]+$/.test(name)) {
        return parent + "[" + name + "]";
    } else {
        return parent + "['" + name + "']";
    }
};

// Main tasks
gulp.task('build-Debug', ['clean', 'set-paths', 'additional-source-files', 'templates', 'dependo', 'css', 'fonts', 'images', 'concat', 'build-dependencies']);
gulp.task('build-Release', ['clean', 'set-paths', 'additional-source-files', 'templates', 'dependo', 'css', 'fonts', 'images', 'uglify', 'build-dependencies']);

gulp.task('build-DebugWatch', ['build-Debug', 'watch-debug']);
gulp.task('build-ReleaseWatch', ['build-Release', 'watch-release']);

gulp.task('default', ['build-Debug']);

// Individual tasks
gulp.task('additional-source-files', ['set-paths'], function (callback) {
	additionalSourceFiles.forEach(function (file) {
		gulp.src(path.join(bases.source, file)).pipe(gulp.dest(bases.dist));
	});
	callback();
});

gulp.task('dependo', ['set-paths', 'templates'], function (callback) {
	dependo(path.join(process.cwd(), bases.source, 'views/app.js'), function (files) {
		paths.files = files;
		callback();
	});
});

gulp.task('build-dependencies', function (callback) {
	var buildName = (releaseMode) ? 'build-Release' : 'build-Debug';
	
    if (dependencies.length && !argv.ignoreDependencies) {
        gutil.log(gutil.colors.cyan('Building dependencies...'));

        dependencies.forEach(function (dependency) {
            gutil.log(gutil.colors.cyan(dependency.name + ": gulp"), path.join(process.cwd(), 'apps'));

            exec('gulp ' + buildName + ' --cwd ' + dependency.path + ' --gulpfile ' + path.join(__dirname, 'gulpfile.js') +
				' --outputFolder ' + path.join(process.cwd(), 'apps') +
				' --buildFolder ' + buildFolder +
				(argv.debugVersionNumber ? ' --debugVersionNumber' : ''), function (errGulp, stdoutGulp, stderrGulp) {
                if (errGulp) {
                    gutil.log(gutil.colors.bgRed(dependency.name + " critical error: "), errGulp);
                    callback(errGulp);
                }

                if (stderrGulp) {
                    gutil.log(gutil.colors.yellow(dependency.name + " error: " + stderrGulp));
                }
                if (stdoutGulp) {
                    gutil.log(dependency.name + ": ", stdoutGulp);
                }

                gutil.log(gutil.colors.green(dependency.name  + " complete"));
            });
        });
    } else {
        callback();
    }
});

gulp.task('clean', function () {
    // Remove previous builds
    del.sync(['apps/' + projectName + '*']);
	
	if (!argv.ignoreDependencies) {
		dependencies.forEach(function (dependency) {
			del.sync(['apps/' + dependency.name + '*']);
		});
	}
});

gulp.task('concat', ['dependo'], function (cb) {
    //gutil.log(gutil.colors.green('Concatenating'), paths.files);
    return gulp.src(paths.files)
        .pipe(concat('app.js'))
        .pipe(wrap(wrapBefore + '<%= contents %>' + wrapAfter))
        .pipe(gulp.dest(bases.dist))
        .pipe(livereload());
});

gulp.task('css', ['set-paths'], function () {
    return (sourceFolders.css) ? gulp.src(paths.css)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(bases.dist + 'css'))
        .pipe(livereload()) : false;
});

gulp.task('fonts', ['set-paths'], function () {
    return (sourceFolders.fonts) ? gulp.src(paths.fonts)
        .pipe(gulp.dest(bases.dist + sourceFolders.fonts)) : false;
});

gulp.task('images', ['set-paths'], function () {
    return (sourceFolders.images) ? gulp.src(paths.images)
        .pipe(gulp.dest(bases.dist + sourceFolders.images)) : false;
});

gulp.task('index', ['set-paths'], function () {
    // Update appName in index.html
    return gulp.src('index_source.html')
        .pipe(replace(/(require\(\[').*(\/app'])/g, '$1' + appName + '$2'))
        .pipe(rename('index.html'))
        .pipe(gulp.dest(''));
});

gulp.task('set-paths', ['svn-version'], function () {
	var cssFiles = sourceFolders.css ? [outputCss].concat(requireCss) : requireCss;
	
    appName = projectName + (svnName ? '_' + svnName : '') + (revisionNo ? '_' + revisionNo : '');

    bases = {
        source: sourceFolders.source + '/' + projectName + '/',
        dist: outputFolder + '/' + appName + '/'
    };

    if (argv.outputFolder) {
        // Convert to forward slashes and add trailing slash
        bases.dist = argv.outputFolder.replace(/\\/g, '/').replace(/\/?$/, '/') + appName + '/';
    }

    paths = {
        css: [bases.source + sourceFolders.css + '/*.scss', bases.source + sourceFolders.css + '/**/*.css'],
        fonts: [bases.source + sourceFolders.fonts + '/*'],
        images: [bases.source + sourceFolders.images + '/*'],
        templates: [bases.source + sourceFolders.templates + '/*.html']
    };

	wrapBefore = 'define(["'+
		requireModules.map(function (module) { return module.id ||  module; }).join('","') + '"' +
		(cssFiles.length ? (',"css!./css' + '/' + (cssFiles).join('","css!./css' + '/') + '"') : '') +
		'], function (' + 
		requireModules.map(function (module) { return module.name ||  module; }) .join(',') +
		') { ';
    wrapAfter = ' return App; });';
});

gulp.task('svn-version', function (callback) {
    var projectPath = process.cwd().replace(/\\/g, '\\\\');

    // Check if release mode and store result - this check only works for first run of build-ReleaseWatch
    if (this.seq.indexOf('build-Release') !== -1) {
        releaseMode = true;
    }

    if (releaseMode || argv.debugVersionNumber) {
		var mode = (releaseMode) ? 'Release' : 'Debug';
        // Release build
        if (!revisionNo && argv.revision) {
            // Use revision number passed by parameters
            revisionNo = argv.revision;
        }

        if (!revisionNo) {
            // Try to get revision number
            fs.writeFileSync('svn-template.txt', '$WCREV$');
            exec('"SubWCRev.exe" "' + projectPath + '" svn-template.txt project-version.txt', function (err, stdout, stderr) {
                if (err) {
					// Try svnversion method if error
					exec('svnversion', function (err, stdout, stderr) {
						if (err) {
							// Omit revision number if error
							gutil.log(gutil.colors.bgMagenta(mode + ' Build - Version not found (err 1)'));
							revisionNo = '';
							callback();
						} else {
							revisionNo = parseInt(stdout, 10);
							gutil.log(gutil.colors.bgMagenta(mode + ' Build - Version: ' + revisionNo));
							callback();
						}
					});
                } else {
                    fs.readFile('project-version.txt', 'utf-8', function (readErr, data) {
                        if (readErr) {
                            // Omit revision number if error
                            gutil.log(gutil.colors.bgMagenta(mode + ' Build - Version not found (err 2)'));
                            revisionNo = '';
                            callback();
                        } else {
                            revisionNo = parseInt(data, 10);
                            gutil.log(gutil.colors.bgMagenta(mode + ' Build - Version: ' + revisionNo));
                            del.sync(['svn-template.txt', 'project-version.txt']);
                            callback();
                        }
                    });
                }
            });
        } else {
            // Using existing revision number
            gutil.log(gutil.colors.bgMagenta('Release Build - Given Version: ' + revisionNo));
            callback();
        }
    } else {
        // Debug build
        gutil.log(gutil.colors.bgMagenta('Debug Build'));
        callback();
    }
});

gulp.task('templates', ['set-paths'], function () {
	var pathSeparatorRegex = new RegExp('\\' + path.sep, 'g');
	
	return (sourceFolders.templates) ? gulp.src(paths.templates)
        .pipe(gulpHandlebars({
            handlebars: handlebars
        }))
        .pipe(wrap('T.<%= processFilePath(file.relative) %> = Handlebars.template(<%= contents %>);', {}, {
			imports: {
				processFilePath: function(filePath) {
				  // Replace path separator with .
				  return filePath.replace(pathSeparatorRegex, '.').replace(/\.js$/, '');
				}
			}
		}))
        .pipe(concat('combined.js'))
        .pipe(wrap('var T = {};\n\n<%= contents %>'))
        .pipe(gulp.dest(bases.source + sourceFolders.templates)) : false;
});

gulp.task('uglify', ['concat'], function (cb) {
    return gulp.src(bases.dist + 'app.js')
		.pipe(uglify())
        .pipe(gulp.dest(bases.dist));
});

gulp.task('war', ['set-paths'], function (callback) {
    var createWarFile,
        webXml,
        webXmlFilename;

    webXml = '';
    webXmlFilename = (argv.webXmlFile) ? 'web.' + argv.webXmlFile + '.xml' : 'web.xml';

    createWarFile = function () {
        gulp.src(['index.jsp', 'favicon3.ico', 'css/**/*', 'img/**/*', 'Images/**/*', 'js/**/*', outputFolder + '/**/*', 'data/**/*', 'schema/**/*', 'Public/Publisher/index.jsp', 'quickview/**/*', 'print/**/*'], { base: '.' })
            .pipe(war({
                welcome: 'index.jsp',
                displayName: projectName,
                webappExtras: [
                    '<context-param><param-name>appKey</param-name><param-value>' + appName + '</param-value></context-param>',
                    '<context-param><param-name>dependencies</param-name><param-value>' + dependencies.map(function(d) { return d.name; }).join(',') + '</param-value></context-param>',
					'<context-param><param-name>showSampleData</param-name><param-value>' + (argv.showSampleData ? 'true' : 'false') + '</param-value></context-param>',
                    webXml
                ]
            }))
            .pipe(zip(warName + '.war'))
            .pipe(gulp.dest(bases.dist + '../'));
        callback();
    };

    fs.readFile(webXmlFilename, 'utf-8', function (readErr, data) {
        if (readErr) {
            // webXmlFilename not found, try web.defaults.xml
            fs.readFile('web.defaults.xml', 'utf-8', function (readErrDefaults, dataDefaults) {
                if (readErrDefaults) {
                    // web.xml not found, try web.defaults.xml
                    gutil.log(gutil.colors.bgRed('web.defaults.xml not found'));
                    createWarFile();
                } else {
                    gutil.log(gutil.colors.bgMagenta('Using web.defaults.xml'));
                    webXml = dataDefaults;
                    createWarFile();
                }
            });
        } else {
            gutil.log(gutil.colors.bgMagenta('Using ' + webXmlFilename));
            webXml = data;
            createWarFile();
        }
    });
});

gulp.task('watch-debug', ['build-Debug'], function () {
    gutil.log(gutil.colors.green('Watching for file changes...'));
    livereload.listen();
    gulp.watch(paths.css, [sourceFolders.css]);
    gulp.watch([bases.source + '**/*.js', bases.source + '**/*.html'], ['dependo', 'concat']);
});
