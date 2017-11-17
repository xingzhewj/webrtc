// 计时
var timer;
function timeInterval() {
    var startTime = +new Date();
    timer = setInterval(function () {
        var time = +new Date() - startTime;
        var minuite = ((Math.floor(time / 1000 / 60) % 60) + '').padStart(2, '0');
        var second = ((Math.floor(time / 1000) % 60) + '').padStart(2, '0');
        postMessage(minuite + ':' + second);
    });
}

onmessage = function (ev) {
    if (ev.data === 'start') {
        timeInterval();
    }
    else if (ev.data === 'stop') {
        clearInterval(timer);
    }
}
