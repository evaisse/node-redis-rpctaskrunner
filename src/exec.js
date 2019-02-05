const childProcess = require('child_process');
const stringio = require('@rauschma/stringio');
const micro = require('micro-whalla');
const yargs = require('yargs');
const connect = require('./init-client');
const debug = require('debug')('redis-rpc-task:worker');

const makeCall = async (client, command, params, opts = {}) => {

    return new Promise((resolve, reject) => {
        let s = client.request(command, params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });

        if (opts.timeout) {
            s.timeout(opts.timeout);
        }

        if (opts.fireAndForget) {
            s.fireAndForget();
        }

        s.send();

        let events = Object.assign({}, opts.events);

        for (let e of Object.keys(events)) {
            s.on(s, events[e]);
        }
    });

};

module.exports = async function (connectionOptions, command) {

    connect(connectionOptions);

    const client = new micro.Client(command.namespace, {});

    /*
        First make a call to check a list of remote available commands
     */
    let commandList = await makeCall(client, '__commandList', null, {
        timeout: 1000 * 5,
    });

    debug('Available remote commands : %o', commandList);

    if (!commandList.find(c => command.task === c)) {
        const publicMethods = commandList
            .filter(c => !c.match(/^__/))
            .map(j => `"${j}"`)
            .join(", ");
        return Promise.reject(new Error(`Invalid task name "${command.task}", available methods : ${publicMethods}`));
    }

    return new Promise((resolve, reject) => {

        let request = client.request(command.task, command);

        if (command.timeout) {
            request.timeout(command.timeout || 1000 * 10);
        } else {
            // base timeout of micro-whalla is 1000, push it to 1min
            request.timeout(1000 * 60 * 30);
        }

        if (command.detached) {
            request.fireAndForget();
        }


        request.send()
            .on('succeeded', function (result) {
                debug("success %o", result);
                resolve(result);
            })
            .on('progress', function (progress) {
                debug("progress %o", result);
            })
            .on('failed', function (error) {
                debug("error %o", error);
                reject(error);
            })
            .on('custom', function (custom) {
                debug("custom %o", custom);
            })
            .on('stderr', (out) => {
                process.stderr.write(out);
            })
            .on('stdout', (out) => {
                process.stdout.write(out);
            });


    });

};