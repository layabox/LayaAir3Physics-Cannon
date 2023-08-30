const fs = require('fs');
const fpath = require('path');
const rimrafSync = require('rimraf').sync;
const glob = require("glob");
const ts = require('typescript');
const { shellExec, copyDirSync } = require("./utils");

if (!fs.existsSync("./scripts/enginePath.txt"))
    throw "请先设置scripts/enginePath.txt的内容为引擎所在目录";

let enginePath = fs.readFileSync("./scripts/enginePath.txt", "utf-8");
console.log(enginePath);

let workDir = process.cwd();
process.chdir(enginePath);

console.log("正在编译和打包引擎...");
shellExec("npm", ["run", "build"]);

process.chdir(workDir);

console.log("正在拷贝引擎...");

copyDirSync(fpath.join(enginePath, "build", "types"), "./libs");

console.log("正在生成IDE专用声明文件...");

let tsconfigPath = fpath.join(enginePath, "src", "layaAir", "tsconfig.json");
let tscPath = "./node_modules/.bin/tsc";
if (process.platform === "win32")
    tscPath += ".cmd";
let tempPath = "./temp";
rimrafSync(tempPath);

shellExec(tscPath, ["-p", tsconfigPath, "-outDir", tempPath,
    "-skipLibCheck", "--declaration", "true", "--removeComments", "false", "--stripInternal", "false", "-emitDeclarationOnly"]);

const dtsContents = [];
const SyntaxKind = ts.SyntaxKind;

function processTree(sourceFile, rootNode, replacer) {
    let code = '';
    let cursorPosition = rootNode.pos;

    function skip(node) {
        cursorPosition = node.end;
    }

    function readThrough(node) {
        code += sourceFile.text.slice(cursorPosition, node.pos);
        cursorPosition = node.pos;
    }

    function visit(node) {
        readThrough(node);

        const replacement = replacer(node);

        if (replacement != null) {
            code += replacement;
            skip(node);
        }
        else {
            ts.forEachChild(node, visit);
        }
    }

    visit(rootNode);
    code += sourceFile.text.slice(cursorPosition, rootNode.end);

    return code;
}

let files = glob.sync(`${tempPath}/**/*.d.ts`, { realpath: true, nosort: false });
for (let file of files) {
    let code = fs.readFileSync(file, "utf-8");
    let declarationFile = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);

    function visitNode(node) {
        if (node.kind == SyntaxKind.ImportDeclaration || node.kind == SyntaxKind.ImportEqualsDeclaration || node.kind == SyntaxKind.ModuleDeclaration) { //删除所有import语句
            return '';
        }
        else if (node.kind == SyntaxKind.TypeReference) {
            let code = declarationFile.text.slice(node.pos, node.end);
            if (code.startsWith(" glTF."))
                return " " + code.substring(6);
        }
        //console.log(node.kind, node.parent?.kind, node.text);
    }

    const content = processTree(declarationFile, declarationFile, visitNode).trimEnd();
    if (content.length == 0 || content == "export {};")
        continue;

    dtsContents.push(content);
}

//pretty print
let code = dtsContents.join("\n\n");

let savePath = fpath.join("./libs/LayaAir.d.ts");


fs.writeFileSync(savePath, code);

rimrafSync(tempPath);