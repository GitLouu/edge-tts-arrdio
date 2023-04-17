const inputTxt = document.querySelector('#txt');
const serviceSelect = document.querySelector('#service');
const languageSelect = document.querySelector('#language');
const voiceSelect = document.querySelector('#voice');

const volumeInput = document.querySelector('#volume');
const volumeValue = document.querySelector('.volume-value');
const pitchInput = document.querySelector('#pitch');
const pitchValue = document.querySelector('.pitch-value');
const rateInput = document.querySelector('#rate');
const rateValue = document.querySelector('.rate-value');

const playBtn = document.querySelector('#play');
const recordBtn = document.querySelector('#record');
const savePathA = document.querySelector('#save-path');
const selectPathBtn = document.querySelector('#select-path');
const titleSelect = document.querySelector("title");
const title = titleSelect.innerText;

const voiceMap = new Map();
const offline = new Map();
const online = new Map();
voiceMap.set('Offline', offline);
voiceMap.set('Online', online);


const NAMES = {
    'HiuGaai': '晓佳',
    'HiuMaan': '晓敏',
    'WanLung': '云龙',
    'Xiaoxiao': '晓晓',
    'Xiaoyi': '晓依',
    'Yunjian': '云健',
    'Yunxi': '云希',
    'Yunxia': '云夏',
    'Yunyang': '云扬',
    'Xiaobei': '晓贝',
    'HsiaoChen': '晓陈',
    'YunJhe': '云哲',
    'HsiaoYu': '晓宇',
    'Xiaoni': '晓妮',
    'Huihui': '慧慧',
    'Kangkang': '康康',
    'Yaoyao': '瑶瑶'
};

function populateVoiceList(voices) {
    offline.clear();
    online.clear();

    for (const voice of voices) {
        var language = voice.name.split('-')[1];
        language = language.substring(0, language.indexOf('(')).trim();

        var map = online;
        if (voice.localService) {
            map = offline;
        }

        if (!map.has(language)) map.set(language, new Array());
        map.get(language).push(voice);
    }

    initLanguage();
}

function initLanguage() {
    languageSelect.innerHTML = '';
    const vMap = voiceMap.get(serviceSelect.value);
    for (const key of vMap.keys()) {
        var option = document.createElement('option');
        option.textContent = key;
        option.value = key;
        if ('CHINESE' === key.toUpperCase()) {
            option.textContent = '中文';
            option.selected = true;
        }
        languageSelect.appendChild(option);
    }
    initVoice();
}

function initVoice() {
    voiceSelect.innerHTML = '';
    const voices = voiceMap.get(serviceSelect.value).get(languageSelect.value);
    if (!voices) return;
    for (const voice of voices) {
        var option = document.createElement('option');
        const names = voice.name.split('-');
        var name = names[0].trim().split(' ')[1];
        if (NAMES[name]) {
            name = NAMES[name];
        }
        var accent = names[1].substring(names[1].indexOf('('));
        if (accent.indexOf('Mainland') > 0 || accent.indexOf('Simplified')) {
            name += ' (普通话)';
        } else if (accent.indexOf('Hong Kong') > 0) {
            name += ' (香港)';
        } else if (accent.indexOf('Cantonese') > 0) {
            name += ' (广东)';
        } else if (accent.indexOf('Northeastern') > 0) {
            name += ' (东北)';
        } else if (accent.indexOf('Taiwan') > 0) {
            name += ' (台湾)';
        } else if (accent.indexOf('Shaanxi') > 0) {
            name += ' (山西)';
        } else {
            name += ' ' + accent;
        }
        option.textContent = name;
        option.setAttribute('data-lang', voice.lang);
        option.setAttribute('data-name', voice.name);
        if (voice.name.indexOf("Xiaoxiao") > 0) {
            option.selected = true;
        }
        voiceSelect.appendChild(option);
    }
}

new Promise((resolve, reject) => {
    const id = setInterval(() => {
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
            clearInterval(id);
        }
    }, 10);
}).then((voices) => {
    populateVoiceList(voices);
    if (voiceMap.get(serviceSelect.value).size == 0) {
        serviceSelect.value = 'Offline';
        serviceSelect.onchange();
    }
});

serviceSelect.onchange = function () {
    console.log(serviceSelect.value);
    if (serviceSelect.value == 'Online' && voiceMap.get('Online').size == 0) {
        serviceSelect.value = 'Offline';
        serviceSelect.onchange();
        alert("没有找到在线语音, 请检查网络是否正常");
        return;
    }
    initLanguage();
};
languageSelect.onchange = initVoice;
pitchInput.onchange = function () {
    pitchValue.textContent = pitchInput.value;
};
rateInput.onchange = function () {
    rateValue.textContent = rateInput.value;
};
volumeInput.onchange = function () {
    volumeValue.textContent = volumeInput.value;
};
aardio.getPath().then(v => { savePathA.textContent = v; });
selectPathBtn.onclick = function () {
    aardio.selectPath().then(path => savePathA.textContent = path);
};

var playing = false;
playBtn.onclick = function () {
    if (playing) {
        speechSynthesis.cancel();
        return;
    }
    if (!voiceSelect.selectedOptions[0]) {
        alert('您没有选择发音人');
        return;
    }
    var txt = inputTxt.value;
    if (txt === '') txt = '请先输入要朗读的文本';
    playing = true;
    recordBtn.disabled = true;
    playBtn.textContent = '停止';
    const utterance = getUtterance(txt);
    utterance.onend = function (event) {
        recordBtn.disabled = false;
        playing = false;
        playBtn.textContent = '朗读';
        titleSelect.innerText = title;
    }
    utterance.onerror = utterance.onend;
    utterance.onstart = function (event) {
        titleSelect.innerText = title + " 朗读中...";
    }

    speechSynthesis.speak(utterance);
}

function getUtterance(txt) {
    const utterance = new SpeechSynthesisUtterance(txt);
    var dataName = voiceSelect.selectedOptions[0].getAttribute('data-name');
    const voices = voiceMap.get(serviceSelect.value).get(languageSelect.value);
    for (i = 0; i < voices.length; i++) {
        if (voices[i].name === dataName) {
            utterance.voice = voices[i];
            break;
        }
    }
    utterance.pitch = pitchInput.value;
    utterance.rate = rateInput.value;
    utterance.volume = volumeInput.value;
    return utterance;
}

var recording = false;
recordBtn.onclick = function () {
    if (recording) {
        aardio.stopRecording();
        speechSynthesis.cancel();
        recording = false;
        return;
    }
    if (!voiceSelect.selectedOptions[0]) {
        alert('您没有选择发音人');
        return;
    }
    const txt = inputTxt.value;
    if (txt === '') {
        alert('请输入要朗读的文本');
        return;
    }
    recording = true;
    var recordName = txt.trim().substring(0, 20).replace(/[\?\/\\\:\*\"\|\<\>\n]/g, '').substring(0, 10);
    aardio.startRecording(recordName).then(() => {
        playBtn.disabled = true;
        selectPathBtn.disabled = true;
        recordBtn.textContent = '停止并保存';
        const utterance = getUtterance(txt);
        utterance.onend = function (event) {
            playBtn.disabled = false;
            selectPathBtn.disabled = false;
            recording = false;
            recordBtn.textContent = '朗读并录音';
            aardio.stopRecording().then((exist) => {
                if (exist)
                    titleSelect.innerText = title + " 录音已保存";
            });
        }
        utterance.onerror = utterance.onend;
        utterance.onstart = function (event) {
            titleSelect.innerText = title + " 朗读录音中...";
        }
        speechSynthesis.speak(utterance);
    });
}

// 禁用右键
// document.oncontextmenu = function () {
//     return false;
// };
//禁用开发者工具F12
// document.onkeydown = document.onkeyup = function (event) {
//     let e = event || window.event || arguments.callee.caller.arguments[0];
//     if (e && e.key === 'F12') {
//         return false;
//     }
//     if (e && e.ctrlKey && e.shiftKey && e.key === 'I'){
//         return false;
//     }
//     return true;
// }

window.onbeforeunload = function () {
    speechSynthesis.cancel();
};