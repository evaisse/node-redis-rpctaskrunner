const dotenv = require('dotenv').config({silent: true});
const program = require('commander');
const debug = require('debug')('redis-rpc-task:cli');
const connect = require('./init-client');


let cmd = false;


program
    .version(require(__dirname+'/../package.json').version);

program
    .command('exec <task>')
    .description('Run given taskname')
    .option("-r, --redis <redisUri>", 'Redis DSN uri [REDIS_URL]')
    .option("-n, --namespace <namespace>", "A given namespace domain restrain RPC call & services [REDIS_RPC_TASK_NAMESPACE]", process.env.REDIS_RPC_TASK_NAMESPACE || "default")
    .option("-d, --detached", "Do not wait for task execution")
    .option("-t, --timeout <timeout>", "Max execution time in milliseconds [REDIS_RPC_REQUEST_TIMEOUT]", v => Math.max(0, parseInt(v, 10)), process.env.REDIS_RPC_REQUEST_TIMEOUT || 0)
    .action((task, command) => {

        cmd = true;

        let options = {
            namespace: command.namespace,
            task: task,
            detached: !!command.detached,
            timeout: command.timeout,
            taskArgs: process.argv.slice(process.argv.indexOf('--')),
        };

        /*
         allow to pipe additionnal command arguments : $<0> exec my-task --timeout 2000 -d -- a5665 --env=2 kcjckjl -d 23 llmk -h
         */
        options.taskArgs.shift();

        debug('run remote command %s with options : %o', options.task, options);

        const connectOptions = { url: program.redis || process.env.REDIS_URL };

        require('./exec')(connectOptions, options)
            .then(exitCode => process.exit(exitCode))
            .catch(e => {
                console.error(e);
                process.exit(1);
            })
    });


program
    .command('serve')
    .description('listen for commands using the list of given task')
    .option("-r, --redis <redisUri>", 'Redis DSN uri [REDIS_URL]')
    .option("-n, --namespace <namespace>", "A given namespace domain restrain RPC call & services [REDIS_RPC_TASK_NAMESPACE]", process.env.REDIS_RPC_TASK_NAMESPACE || "default")
    .option("-c, --concurrency <concurrency>", "How many task can be run in parralel [REDIS_RPC_TASK_CONCURRENCY]", v => Math.max(0, parseInt(v, 10)), process.env.REDIS_RPC_TASK_CONCURRENCY || 1)
    .option("-p, --additional-methods <glob-pattern>", "Additional method path [REDIS_RPC_TASK_AUTOLOAD_PATTERN], ", process.env.REDIS_RPC_TASK_AUTOLOAD_PATTERN || "./**/*.method.js")
    .option("-t, --timeout <timeout>", "Max execution time in milliseconds for a task [REDIS_RPC_TASK_TIMEOUT]", v => Math.max(0, parseInt(v, 10)), process.env.REDIS_RPC_TASK_TIMEOUT || 0)
    .action(async function (command) {

        cmd = true;

        const options = {
            namespace: command.namespace,
            timeout: command.timeout,
            additionalMethods: command.additionalMethods,
            concurrency: command.concurrency,
        };

        const connectOptions = { url: program.redis || process.env.REDIS_URL };
        debug('Start worker with %o', options);
        try {
            const worker = await require('./worker')(connectOptions, options);
            return Promise.resolve(worker.start());
        } catch (e) {
            console.error(e);
            return process.exit(1);
        }

    });



program.parse(process.argv);


if (!cmd) {
    program.outputHelp();
}