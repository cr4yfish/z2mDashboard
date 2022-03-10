const wakeTime = document.getElementById("wakeTime");
let timeout = null;
wakeTime.addEventListener("input", function(e) {
    clearTimeout(timeout)
    
    timeout = setTimeout(function() {
        const time = wakeTime.value;
        const hourTenths = time[0],
            hourSingle = time[1],
            minuteTenths = time[3],
            minuteSingle = time[4];
    
            alert(`Time is ${hourTenths}${hourSingle} : ${minuteTenths}${minuteSingle}`);

    }, 1000);
});