# node-redis-rpctaskrunner

Execute remote script using redis,
without stderr, stdout and exit code support. 

Install
###

```bash
npm i -g redis-rpc-taskrunner
```

Usage
###

Watch current dir executable files and publish them as "methods". for exemple `./echo.sh`

```bash
# will watch 
redis-rpc-taskrunner serve
```

On the other side, just 

```bash
# will watch 
redis-rpc-taskrunner exec echo.sh "foo"
```

Will pipe all stderr & stdout of the remote script to current call (exit code also).


man
###

```
$> redis-rpc-taskrunner serve -h
Usage: serve [options]

listen for commands using the list of given task

Options:
  -r, --redis <redisUri>                   Redis DSN uri [REDIS_URL]
  -n, --namespace <namespace>              A given namespace domain restrain RPC call & services [REDIS_RPC_TASK_NAMESPACE] (default: "default")
  -c, --concurrency <concurrency>          How many task can be run in parralel [REDIS_RPC_TASK_CONCURRENCY] (default: 1)
  -p, --additional-methods <glob-pattern>  Additional method path [REDIS_RPC_TASK_AUTOLOAD_PATTERN],  (default: "./**/*.method.js")
  -t, --timeout <timeout>                  Max execution time in milliseconds for a task [REDIS_RPC_TASK_TIMEOUT] (default: 0)
  -h, --help                               output usage information
```

```
$> redis-rpc-taskrunner exec -h

Usage: exec [options] <task>

Run given taskname

Options:
  -r, --redis <redisUri>       Redis DSN uri [REDIS_URL]
  -n, --namespace <namespace>  A given namespace domain restrain RPC call & services [REDIS_RPC_TASK_NAMESPACE] (default: "default")
  -d, --detached               Do not wait for task execution
  -t, --timeout <timeout>      Max execution time in milliseconds [REDIS_RPC_REQUEST_TIMEOUT] (default: 0)
  -h, --help                   output usage information

```
