import * as readline from 'readline';
import * as fs from 'fs';
import * as shell from 'shelljs';
import { Config, Logger } from 'lib-dd-helpers';

const log = Logger.getInstance().getLogger('main');
const config = Config.getInstance();
const RSYNC_FILES_PATH = config.get('RSYNC_FILES_PATH');
const RSYNC_COMMAND = `rsync -azvhP --delete ${config.get('RSYNC_COMMAND')}`;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

main();

function main() {
    log.info('>>> touch yubikey please >>>');
    const output = shell.exec('ssh adm512 "cd data && git status -s"', { silent: true });

    if (output.code !== 0) {
        log.error('--- ERROR ---\n');
        process.exit(output.code);
    }

    log.info('--- FILES TO SYNC ---');

    const fileList = output.stdout.split('\n');
    const fixedList = [];
    fileList.forEach(file => {
        // M.. → remove git status
        const fileName = file.slice(3);

        if (fileName) {
            log.info(fileName);
            fixedList.push(fileName);
        }
    });

    log.info('---');

    if (fixedList.length === 0) {
        log.info('--- SKIP: No files to sync ---\n');
        process.exit(0);
    }

    fs.writeFileSync(RSYNC_FILES_PATH, fixedList.join('\n'));

    const result = shell.exec(RSYNC_COMMAND + ' --dry-run');
    if (result.code !== 0) {
        log.error(`Error! Result code: ${result}`);
        process.exit(1);
    }

    rl.question('All fine (y/n)?\n', checkAndRun);
}

function checkAndRun(answer: string) {
    if (['Y', 'y', 'yes'].includes(answer)) {
        shell.exec(RSYNC_COMMAND);

        log.info('--- DONE --- \n');
        process.exit(0);
    }

    log.info('--- TERMINATED ---\n');
    process.exit(1);
}
