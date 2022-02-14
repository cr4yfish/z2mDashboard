console.log("Loading Queue Module...");

// refresh timer in ms, default 2 seconds
let __REQUEST_QUEUE_REFRESH_TIMER = 2000;
// timeout time in seconds, default 2 minutes
let __REQUEST_QUEUE_TIMEOUT_TIME = 120;

const setRefreshTimer = function(newVal) {
    newVal = parseInt(newVal);
    __REQUEST_QUEUE_REFRESH_TIMER = newVal;
}

const setQueueTimeout = function(newVal) {
    newVal = parseInt(newVal);
    __REQUEST_QUEUE_TIMEOUT_TIME = newVal;
}

// RequestQueue holds an array of objects with { request: Object, type: string }
let RequestQueue = [], isWorking = false;

// Only needed for debugging
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const insertNewRequest = function(Request, reqType) {
    return new Promise((resolve, reject) => {

        // valid reqType's
        // -- getIndivData, getData
        RequestQueue.push({ request: Request, type: reqType });

        let timer = 0;
        // check every second if request has been handled
        // rejects if Request could not be handled
        // timeouts after n time in seconds
        let reqCheck = setInterval(async () => {
            timer++;
            if(RequestQueue[0].hasOwnProperty("done")) {
                if(RequestQueue[0].done === true) {
                    console.log("shifting request out");
                    const handledRequest = RequestQueue.shift();
                    resolve(handledRequest);
                } else {
                    console.log("shifting request out");
                    const handledRequest = RequestQueue.shift();
                    reject(handledRequest);
                }

                clearInterval(reqCheck);

            } else if (timer == __REQUEST_QUEUE_TIMEOUT_TIME) {
                // timeout
                console.log("timeout");
                const unhandledRequest = RequestQueue.shift();
                reject({ Request: unhandledRequest, reason: "timeout" });
                clearInterval(reqCheck);
            }
        }, 1000);

    })
}

// runs every n seconds, checking if there are Requests waiting
// n is specified as __REQUEST_QUEUE_REFRESH_TIMER constant
setInterval(async function () {
    // only do something if not working and requestQueue holds data
    if(RequestQueue[0] != undefined) {
        console.log("checking queue, current:", RequestQueue[0]);
    }
     
    if(!isWorking && RequestQueue.length > 0) {
        try {
            console.log("-- Next Request inserted", RequestQueue[0].request.reqFriendlyName), RequestQueue[0].type;
            isWorking = true;
            let data;

            // switches types
            /* DISABLED FOR DEBUGGING
            switch(RequestQueue.type) {
                case "getIndivData":
                    data = await getIndivData(RequestQueue[0]);
                    break;
                case "getData":
                    data = await getData(RequestQueue[0]);
                    break;
                case "sendData":
                    data = await sendData(RequestQueue[0]);
                    break;
            } */


            // debug
            await sleep(2500);

            console.log(`-- Request done: ${RequestQueue[0].request.reqFriendlyName} of type ${RequestQueue[0].type}`);         
            RequestQueue[0].done = true;
            isWorking = false;
        } catch (err) { 
            console.log("-- Error at Queue: Failed to handle Request:", 
            RequestQueue[0],
            err );
            
            if(RequestQueue[0] != undefined) {
                RequestQueue[0].done = false;
            } else {
                RequestQueue[0] = { done: false };
            }
            
            isWorking = false; 
        }
    } 
}, __REQUEST_QUEUE_REFRESH_TIMER);

exports.insertNewRequest = insertNewRequest;
exports.setQueueTimeout = setQueueTimeout;
exports.setRefreshTimer = setRefreshTimer;

console.log("Queue module loaded");
console.log("====");