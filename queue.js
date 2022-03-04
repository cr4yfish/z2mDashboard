const { experimentalRequest, getRequest, sendRequest, getRequestWithBody } = require("./mqttNetworkFunctions");

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

        RequestQueue.push({ request: Request, type: reqType });

        let timer = 0;
        // check every second if request has been handled
        // rejects if Request could not be handled
        // timeouts after n time in seconds
        let reqCheck = setInterval(async () => {
            timer++;
            if(RequestQueue[0].hasOwnProperty("done")) {
                if(RequestQueue[0].done === true) {
                    console.log("Done, shifting request out");
                    const handledRequest = RequestQueue.shift();
                    resolve(handledRequest);
                } else {
                    console.log("Error, shifting request out");
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
            console.log("-- Next Request inserted", RequestQueue[0].request), RequestQueue[0].type;
            isWorking = true;
            let data;

            // switches types
            switch(RequestQueue[0].type) {
                case "getIndivData":
                    data = await getIndivData(RequestQueue[0].request);
                    break;
                case "getData":
                    data = await getData(RequestQueue[0].request);
                    break;
                case "sendData":
                    data = await sendRequest(RequestQueue[0].request.url, RequestQueue[0].request.body);
                    break;
                case "experimentalData":
                    data = await experimentalRequest(RequestQueue[0].request.url, RequestQueue[0].request.body);
                    break;
                default:
                    throw new Error("Request type not supported!",RequestQueue[0].type);
            }

            RequestQueue[0].response = data;
            console.log(`-- Request done: ${RequestQueue[0].request} of type ${RequestQueue[0].type}`);         
            RequestQueue[0].done = true;
            isWorking = false;
        } catch (err) { 
            console.log("-- Error at Queue: Failed to handle Request:", 
            RequestQueue[0],
            err );
            
            RequestQueue[0] = { done: false, reason: err.message, request: RequestQueue[0] };
            isWorking = false; 
        }
    } 
}, __REQUEST_QUEUE_REFRESH_TIMER);

// getData Params:  @Request : { url: string, body: Object } 
function getData(Request) {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await getRequest(Request.url, "message");
            resolve(data);
        } 
        catch (err) {
            reject(err);
        }
    })
}

// getIndivData Params: @Request: { url: String, body: Object }
function getIndivData(Request) {
    return new Promise(async (resolve, reject) => {
        console.log("Getting indiv data for", Request.friendlyName);
        try {
            Request.body = `{"${Request.attribute}": ""}`;
            Request.url = `zigbee2mqtt/${Request.friendlyName}`;
            let data = await experimentalRequest(Request.url, Request.body);
            data.friendlyName = Request.friendlyName;
            console.log("Done getting data");
            resolve(data);
        } catch (err) {
            reject(err);
        }
    })
}

exports.insertNewRequest = insertNewRequest;
exports.setQueueTimeout = setQueueTimeout;
exports.setRefreshTimer = setRefreshTimer;

console.log("Queue module loaded");
console.log("====");