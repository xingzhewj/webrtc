//初始化 Wilddog Auth
var config = {
    authDomain: "wd9513111949gjinvc.wilddog.com"
};
wilddog.initializeApp(config);
// 初始化 WilddogVideoCall 之前，要先经过身份认证。这里采用匿名登录的方式。推荐使用其他登录方式。
wilddog.auth().signInAnonymously()
.then(function(user){
    document.getElementById('uid_client_text').innerText = user.uid;
    //认证成功后，初始化 WilddogVideoCall
    wilddogVideo.initialize({'appId':'wd3735222172bbrfog','token':user.getToken()})
    //获取 `WilddogVideoCall` 实例
    videoInstance = wilddogVideo.call();
    // 绑定本地视频播放
    bindVideo(videoInstance);
}).catch(function (error) {
    // Handle Errors here.
    console.log(error);
});
// 绑定本地视频播放
function bindVideo(videoInstance) {
    var clientVideo = document.getElementById('client_video');
    wilddogVideo.createLocalStream({
        // 音频
        captureAudio:true,
        // 视频
        captureVideo:true,
        dimension:'480p',
        // 视频的最大帧率，默认为 15 帧 / 秒
        maxFPS: 15
    }).then(function (localStream) {
        localStream.attach(clientVideo);
        // 接受远端视频请求
        videoInstance.on('called', function (incomingConversation) {
            document.getElementById('uid_remote_text').innerText = incomingConversation.remoteUid;
            incomingConversation.accept(localStream);
            // 接受邀请方视频流
            incomingConversation.on('stream_received', function (remoteVideo) {
                remoteVideo.attach(document.getElementById('remote_video'));
            });
        });
        // 发起远程链接
        document.getElementById('connect_btn').addEventListener('click', function () {
            var uid = document.getElementById('uid').value;
            connectRemote(uid, localStream, videoInstance);
        });
    });
}

var recorder;
var recorderFile;
// 设置远程视频链接
function connectRemote(uid, localStream, videoInstance) {
    var mConversation = videoInstance.call(uid, localStream, JSON.stringify({
        msg: 'hello'
    }));
    // 监听参与者的stream_received事件，将对端的流媒体绑定到页面的video中
    var remoteVideo = document.getElementById('remote_video');
    mConversation.on('stream_received', function (remoteStream) {
        recorder = new MediaRecorder(remoteStream.stream);
        var chunks = [];
        recorder.ondataavailable = function(e) {
            chunks.push(e.data);
        };
        recorder.onstop = function (e) {
            recorderFile = new Blob(chunks, { 'type' : recorder.mimeType });
            chunks = [];
        };
        remoteStream.attach(remoteVideo);
    });
    // 检测远程链接相应状态
    mConversation.on('response', function (callStatus) {
        switch (callStatus){
            case 'ACCEPTED':
                console.log("log","通话被接受");
                document.getElementById('uid_remote_text').innerText = uid;
                // 启用录制功能
                enableBtns();
                break;
            case 'REJECTED':
                console.log("log","通话被拒绝");
                break;
            case 'BUSY':
                console.log("log","正忙");
                break;
            case 'TIMEOUT':
                console.log("log","超时");
                break;
            default:
                console.log("log","状态未识别");
                break;
        }
    });
}

// 录制操作
var recordBtn = document.getElementById('record_btn');
var reocrdEndBtn = document.getElementById('record_end_btn');
var recordPlayBtn = document.getElementById('record_play_btn');
function disabledBtns() {
    recordBtn.setAttribute('disabled', 'disabled');
    reocrdEndBtn.setAttribute('disabled', 'disabled');
    recordPlayBtn.setAttribute('disabled', 'disabled');
}
// 先禁用，在连接视频通信成功后再启用
disabledBtns();
function enableBtns() {
    recordBtn.removeAttribute('disabled');
    reocrdEndBtn.removeAttribute('disabled');
    recordPlayBtn.removeAttribute('disabled');
}
var worker = new Worker('./time.js');
recordBtn.addEventListener('click', function () {
    recorder.start();
    worker.postMessage('start');
});
reocrdEndBtn.addEventListener('click', function () {
    recorder.stop();
    worker.postMessage('stop');
});
recordPlayBtn.addEventListener('click', function () {
    var url = URL.createObjectURL(recorderFile);
    document.getElementById('record_video').src = url;
});
// 计时
worker.onmessage = function(ev) {
    document.getElementById('time_text').innerText = ev.data;
};