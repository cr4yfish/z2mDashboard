console.log("Loading globals module...");

let _IPADDRESS;

const setIPAddress = function(str) {
    _IPADDRESS = str;
}

const getIPAddress = function() {
    return _IPADDRESS;
}

exports.setIPAddress = setIPAddress;
exports.getIPAddress = getIPAddress;

console.log("Globals module loaded");