const RSYNC_FILES_PATH = 'PATH TO >>> rsync_include.txt';
const RSYNC_COMMAND =    'rsync -azvhP --delete --files-from=rsync_include.txt ' +
                         '_replace_host_from_:/home/.../path ~/work/.../path';

const shell = require('shelljs');
const fs = require('fs');
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('>>> touch yubikey please >>>');
const output = shell.exec('ssh _replace_host_ "cd data && git status -s"', { silent: true });

if (output.code === 0 && output.stdout) {
    console.log(output.stdout);
}

const fileList = output.stdout.split('\n');
const fixedList = [];
fileList.forEach(file => {
    // M.. → remove git status
    const fileName = file.slice(3);

    if (fileName) {
        fixedList.push(fileName);
    }
});

if (fixedList.length === 0) {
    console.log('--- SKIP: No files to sync ---\n');
    process.exit(0);
}

fs.writeFileSync(RSYNC_FILES_PATH, fixedList.join('\n'));

const result = shell.exec(RSYNC_COMMAND + ' --dry-run');
if (result.code !== 0) {
    console.log('Error!');
    process.exit(1);
}

rl.question('All fine (y/n)?\n', answer => {
    if (['Y', 'y', 'yes'].includes(answer)) {
        shell.exec(RSYNC_COMMAND);

        console.log('--- DONE --- \n');
        process.exit(0);
    }

    console.log('--- TERMINATED ---\n');
    process.exit(1);
});
