const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
process.chdir(root);
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--noEmit'], { stdio: 'inherit' });

// Export every adapter class, as the original standalone library did.
const entries = fs.readdirSync('CannonPhysics/source', { recursive: true })
    .filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts'))
    .sort()
    .map(file => `export * from ${JSON.stringify('./' + file.split(path.sep).join('/'))};`);

esbuild.buildSync({
    stdin: { contents: entries.join('\n'), resolveDir: path.join(root, 'CannonPhysics/source'), loader: 'ts' },
    bundle: true,
    format: 'iife',
    globalName: '__LayaCannon',
    target: 'es2017',
    outfile: 'CannonPhysics/dist/laya.cannon.js',
    // Load Cannon before registering the adapter, and preserve its license.
    banner: { js: fs.readFileSync('CannonPhysics/source/libs/cannon.js', 'utf8') + '\n;' },
    footer: { js: 'Object.assign(Laya, __LayaCannon);' },
});
console.log('Built CannonPhysics/dist/laya.cannon.js');
