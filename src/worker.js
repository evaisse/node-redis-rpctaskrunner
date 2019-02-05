const childProcess = require('child_process');
const stringio = require('@rauschma/stringio');
const micro = require('micro-whalla');
const connect = require('./init-client');
const glob = require('glob');
const fs = require('fs');
const stream = require('stream');
const debug = require('debug')('redis-rpc-task:worker');

const findExecutableFiles = async (globPath) => {

    return new Promise((resolve, reject) => {

        let ok = [];

        glob('./*', {}, (err, files) => {
            debug('run glob to %s with %s', globPath, files);

            if (err) {
                return reject(err);
            }

            for (let fpath of files) {
                let fd = fs.openSync(fpath, 'r');
                let stats = fs.fstatSync(fd);

                if (stats.isFile()) {
                    try {
                        debug('add %s to command list', fpath);
                        fs.accessSync(fpath, fs.constants.X_OK);
                        ok.push(fpath);
                    } catch (e) {
                        //
                        debug('do not add %s because is not executable', fpath);
                    }
                }
            }
            resolve(ok);
        });

    });

};

const runTask = async (req, res) => {

    const taskFile = req.data.taskFile;
    const taskArgs = req.data.taskArgs;

    debug('start task %s with %o', taskFile, req.data);

    if (!fs.existsSync('./' + taskFile)) {
        throw new Error('Invalid task ' + taskFile + ' from client ' + msg.from);
    }

    debug('start running command: %s %s', './' + taskFile, taskArgs.join(' '));

    const child = childProcess.spawn('./' + taskFile, taskArgs);

    let exitCode = 1;

    child.stdout.on('data', (data) => {
        res.event('stdout', data + '');
    });

    child.stderr.on('data', (data) => {
        res.event('stderr', data + '');
    });

    child.on('close', (code) => {
        debug(`child process exited with code ${code}`);
        exitCode = code;
    });

    try {
        let finished = await stringio.onExit(child);
        debug('done running command %s : %s with code %o', './' + taskFile, taskArgs.join(' '), exitCode);
        res.done(exitCode);
    } catch (e) {
        // exit code not 0.
        res.done(exitCode);
    }

};

module.exports = async (connectionOptions, command) => {

    connect(connectionOptions);

    const service = new micro.Service(command.namespace, {
        concurrency: command.concurrency,
    });

    let files = await findExecutableFiles('./*');
    files = files.map(fpath => fpath.split('/').pop());

    debug('load additionnal executable commands : %o', files);

    for (let file of files) {
        service.register(file, async (req, res) => {
            debug('run command %s', file);
            req.data.taskFile = file; // set param taskFile fome file
            try {
                let r = await runTask(req, res);
                res.done(r);
            } catch (e) {
                console.error(e);
                res.error(e);
            }
        });
    }

    debug('lookup for additionnal methods in %s', command.additionalMethods);

    service.findAndRegisterMethods(command.additionalMethods);

    console.log('Setup worker with following commands', Object.keys(service._methods));

    service.register('__ping', (req, res) => {
        res.done("pong");
    });

    service.register('__commandList', (req, res) => {
        const availableMethods = Object.keys(service._methods);

        if (req.data) {
            if (availableMethods.find(m => m === req.data)) {
                return res.error(new Error('Invalid method ' + req.data));
            }
            res.done('Method is available');
        } else {
            res.done(availableMethods);
        }
    });

    return Promise.resolve(service);
};