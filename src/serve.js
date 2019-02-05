const createWorker = require('./worker');




module.exports = function (program) {


    const worker = createWorker(program);

    worker.start();

};