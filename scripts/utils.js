const spawn = require('cross-spawn');
const fpath = require('path');
const fs = require('fs');

function shellExec(command, args, fetchOutput) {
    ret = spawn.sync(command, args, fetchOutput ? null : { stdio: 'inherit' });
    if (ret.status != 0) {
        console.error(ret.error);
        process.exit(1);
    }

    if (fetchOutput)
        return ret.output?.[1]?.toString().trim();
}

function copyDirSync(source, destDirectory) {
    if (!fs.existsSync(destDirectory))
        fs.mkdirSync(destDirectory, { recursive: true });

    let paths = fs.readdirSync(source, { withFileTypes: true });
    paths.forEach(path => {
        if (path.isDirectory()) {
            let dst2 = fpath.join(destDirectory, path.name);
            if (!fs.existsSync(dst2))
                fs.mkdirSync(dst2);

            copyDirSync(fpath.join(source, path.name), dst2);
        }
        else {
            fs.copyFileSync(fpath.join(source, path.name), fpath.join(destDirectory, path.name));
        }
    })
}

module.exports = { shellExec, copyDirSync };