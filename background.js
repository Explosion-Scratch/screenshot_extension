let options = {
    FORMAT: "png",
    SCALE_FACTOR: 1.5,
    JPEG_QUALITY: 100,
}
let storage = {
    get: (item) => {
        return new Promise(res => {
            chrome.storage.sync.get([item], (s) => res(s[item]))
        })
    },
    set: (item, val) => {
        return new Promise(res => {
            chrome.storage.sync.set({[item]: val}, (s) => res())
        })
    },
}

;(async () => {
    options = {...options, ...await storage.get("settings")};
    console.log(options);
})();

let DATA;

chrome.runtime.onMessage.addListener(async (msg, _, respond) => {
    console.log(msg);
    if (msg.type === "capture"){
        options = {...options, ...await storage.get("settings")};
        let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        capture(tab);
        respond();
    }
    if (msg.type === "getImage"){
        respond({type: "image", data: DATA});
    }
})

async function capture(tab){
    let l = createLogger("background", "action.onClicked", tab.id);
    l("Starting");
    await attach(tab.id, null, tab);
    l("Attached debugger")
    await enablePage(tab.id);
    l("Enabled debugger page");
    await setBg(tab.id, { color: { r: 0, g: 0, b: 0, a: 0 } });
    l("Set colorless background");
    const {contentSize: {width, height}}  = await getSize(tab.id);
    l("Got layout metrics", {width, height});
    await setSize(tab.id, {height, width});
    l("Set layout metrics");
    await sleep(500);
    l("Capturing screenshot");
    let data = await screenshot(tab.id);
    l("Got screenshot, waiting", data);
    await sleep(500);
    await clearSize(tab.id);
    l("Cleared device metrics, opening tab");
    await openTab(data, tab.id);
    l("Finished");
    try {
    chrome.runtime.sendMessage({type: "done"});} catch(_){}
}

function log(where, what, status, tabId, details){
    console.log(`[${what}] {${where}} [%o]: %o, ${details ? "%o" : ""}`, tabId, status, ...(details ? [details] : []));
    if (where === "background" && what === "action.onClicked" && tabId){
        try {
        chrome.runtime.sendMessage({type: "status", text: status});}catch(_){}
    }
}

function createLogger(where, what, tabId){
    return (status, details) => {
        log(where, what, status, tabId, details);
    }
}

function clearSize(tabId) {
    return new Promise((resolve) => {
        chrome.debugger.sendCommand(
            {
                tabId: tabId,
            },
            "Emulation.clearDeviceMetricsOverride",
            resolve,
        );
    });
}


function screenshot(tabId) {
    return new Promise((resolve, reject) => {
        let l = createLogger("background", "captureScreenshot", tabId);
        chrome.debugger.sendCommand(
            { tabId: tabId },
            "Page.captureScreenshot",
            {
                format: options.FORMAT,
                fromSurface: true,
                ...(options.FORMAT === "jpeg" ? {quality: options.JPEG_QUALITY} : {})
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    l("Failed", chrome.runtime.lastError)
                    reject(chrome.runtime.lastError);
                } else {
                    var dataType = typeof response.data;
                    l("Success", response)
                    let base_64_data = `data:image/${options.FORMAT};base64,${response.data}`;
                    resolve(base_64_data);
                }
            }
        );

        l("Command sent");
    });
}

function setSize(tabId, {height, width}) {
    return new Promise((resolve) => {
        chrome.debugger.sendCommand(
            {
                tabId: tabId,
            },
            "Emulation.setDeviceMetricsOverride",
            { height: height, width: width, deviceScaleFactor: options.SCALE_FACTOR, mobile: false },
            resolve
        );
    });
}

function getSize(tabId) {
    return new Promise((resolve) => {
        chrome.debugger.sendCommand(
            {
                tabId: tabId,
            },
            "Page.getLayoutMetrics",
            {},
            resolve
        );
    });
}

function setBg(tabId, bg) {
    return new Promise((resolve) => {
        chrome.debugger.sendCommand(
            { tabId: tabId },
            "Emulation.setDefaultBackgroundColorOverride",
            bg,
            resolve
        );
    });
}


function enablePage(tabId) {
    return new Promise((resolve) => {
        chrome.debugger.sendCommand({ tabId: tabId }, "Page.enable", {}, function () {
            resolve(tabId)
        });
    });
}


function attach(tabId, changeInfo, tab) {
    return new Promise((resolve, reject) => {
            if (tab.status == "complete") {
                chrome.debugger.attach({ tabId: tabId }, "1.0", () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(tab || {id: tabId});
                    }
                });
            }
    });
}

async function openTab(data, tabId){
    console.log({data, tabId});
    await new Promise(res => chrome.debugger.detach({tabId: tabId}, res));
    chrome.tabs.create({url: "image.html"});
    DATA = data;
}

function sleep(ms){return new Promise(r => setTimeout(r, ms))}