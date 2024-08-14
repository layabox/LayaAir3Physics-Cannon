const path = require('path');
const rimrafSync = require('rimraf').sync;
const matched = require('matched');
const gulp = require('gulp');
const gulpts = require('gulp-typescript');
const concat = require('gulp-concat');
const inject = require('gulp-inject-string');
const sourcemaps = require('gulp-sourcemaps');
const rollup = require('rollup');
const glsl = require('rollup-plugin-glsl');
const rollupSourcemaps = require('rollup-plugin-sourcemaps');
const merge = require('merge2');
const fs = require("fs");

const tscOutPath = "./build/tsc/";
const sourcemap = true;

//编译新的库文件只需要在packsDef中配置一下新的库就可以了
const packsDef = [
    {
        'libName': "cannon",
        'input': [
            '*.**',
            '**/*.*',
        ],
    }
];


/*
    并非所有循环引用都会引起加载问题，如果两个模块只是使用对方的类型声明，没有使用继承/构造行为，是允许的。
    这里忽略这类情况。
*/
const ignoreCirclarDependencyWarnings = true;

const onwarn = warning => {
    let msg = warning.message;
    if (warning.code === 'CIRCULAR_DEPENDENCY') {
        if (ignoreCirclarDependencyWarnings)
            return;

        let arr = msg.split("->");
        arr = arr.map(e => {
            e = e.trim();
            return path.basename(e, path.extname(e));
        });
        msg = arr.join(" -> ");
        msg = "(C_D) " + msg;
        console.warn(msg);
    }
    else
        console.warn(warning);
}

gulp.task('compile', () => {
    rimrafSync(tscOutPath);

    const proj = gulpts.createProject("tsconfig.json", {
        removeComments: true,
    });

    return merge(
        proj.src()
            .pipe(sourcemaps.init())
            .pipe(proj())
            .pipe(sourcemaps.write('.', { sourceRoot: './', includeContent: false }))
            .pipe(gulp.dest(tscOutPath)),


    );
});

gulp.task("buildJs", async () => {
    rimrafSync("./out");


    const rootPath = process.cwd();
    const outPath = path.join(rootPath, tscOutPath);
    const mentry = '[entry]';

    function myMultiInput(pkgDef, files, fileSet) {
        return {
            resolveId(id, importer) {
                if (id === mentry)
                    return mentry;

                if (importer == null)
                    return;

                var ext = path.extname(id);
                if (ext == ".js" || ext == "") {
                    var importfile = path.join(importer === mentry ? rootPath : path.dirname(importer), id);
                    if (ext == "")
                        importfile += ".js";

                    if (!fileSet.has(importfile)) {
                        if (pkgDef.libName == "core")
                            console.warn(`external: ${path.relative(outPath, importer)} ==> ${path.relative(outPath, importfile)}`);
                        return { id: 'Laya', external: true };
                    }
                }
            },

            load(id) {
                if (id === mentry)
                    return files.map(ele => `export * from ${JSON.stringify(tscOutPath + ele)};`).join('\n');
            }
        };
    }

    async function getFiles(input) {
        var include = [];
        var exclude = [];

        if (typeof input === 'string') {
            include = [input];
        } else if (Array.isArray(input)) {
            include = input;
        } else {
            include = input.include || [];
            exclude = input.exclude || [];
        }

        var patterns = include.concat(exclude.map(function (pattern) {
            return '!' + pattern;
        }));

        return matched.promise(patterns, { cwd: path.join(process.cwd(), "./src"), realpath: false });
    }

    for (let i = 0; i < packsDef.length; ++i) {
        let files = await getFiles(packsDef[i].input);

        files = files.filter(ele => ele.endsWith(".ts")).map(ele => ele = ele.substring(0, ele.length - 3) + ".js");
        let fileSet = new Set(files.map(ele => path.normalize(outPath + ele)));

        let config = {
            input: mentry,
            output: {
                extend: true,
                globals: { 'Laya': 'Laya' }
            },
            external: ['Laya'],
            onwarn: onwarn,
            plugins: [
                myMultiInput(packsDef[i], files, fileSet),
                rollupSourcemaps(),
                glsl({
                    include: /.*(.glsl|.vs|.fs)$/,
                    sourceMap: sourcemap,
                    compress: false
                })
            ],
        };

        let outputOption = {
            file: path.join("./build/jslib", "laya." + packsDef[i].libName + ".js"),
            format: 'iife',
            esModule: false,
            name: 'Laya',
            globals: { 'Laya': 'Laya' },
            sourcemap: sourcemap
        };
        if (packsDef[i].libName != "core")
            outputOption.extend = true;

        const bundle = await rollup.rollup(config);
        await bundle.write(outputOption);
    }

    return merge(
        packsDef.map(pack => {
            return gulp.src(path.join("./build/jslib", "laya." + pack.libName + ".js"))
                .pipe(inject.replace(/var Laya = \(function \(exports.*\)/, "window.Laya = (function (exports)"))
                .pipe(inject.replace(/}\)\({}, Laya\);/, "})({});"))
                .pipe(inject.replace(/Laya\$1\./g, "exports."))
                .pipe(inject.replace(/\(this.Laya = this.Laya \|\| {}, Laya\)/, "(window.Laya = window.Laya || {}, Laya)"))
                .pipe(gulp.dest(process.platform == 'win32' ? '.' : './out')); //在win下dest竟然突然变成src的相对目录
        }),
    );
});


gulp.task('concatCannonPhysics', () => {
    return gulp.src([
        path.join("./build/jslib", "laya.cannon.js"),
        './libs/cannon.js',
    ])
        .pipe(concat('laya.cannon.js'))
        .pipe(gulp.dest('./out/'));
});

gulp.task('copyLibs', (done) => {
    fs.copyFile(path.join("./build/jslib", "laya.cannon.js.map"), path.join("./out", "laya.cannon.js.map"), done);
});
gulp.task('build',
    gulp.series('compile', 'buildJs', 'concatCannonPhysics', 'copyLibs'));
