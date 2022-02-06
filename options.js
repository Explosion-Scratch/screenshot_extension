(async () => {
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

let settings = {
    SCALE_FACTOR: 1,
    FORMAT: "png",
    JPEG_QUALITY: 100,
    ...(await storage.get("settings"))
};

init();
update();

function init(){
    for (let input of document.querySelectorAll("input")){
        let val = settings[input.id];
        if (input.type === "checkbox"){
            input.parentElement.classList.add("form-switch");
            let i = document.createElement("i");
            input.insertAdjacentElement("afterend", i);
            input.checked = val;
            console.log({type: input.type, val});
            continue;
        }
        if (input.type === "radio"){
            val = settings[input.name];
            console.log({type: input.type, val});
            if (input.value === val){
                input.checked = true;
            } else {input.checked = false}
            continue;
        }
        input.value = val;
    }
}
for (let input of document.querySelectorAll("input")){
    let fn = ({target: {value}}) => {
        if (input.type === "checkbox"){
            value = input.checked;
        }
        if (input.type === "number"){
            value = parseInt(input.value);
        }
        if (input.type === "radio"){
            value = document.querySelector(`[name="${input.name}"]:checked`).value;
        }
        settings[input.name || input.id] = value;
        console.log({value, settings});
        update();
    }
    input.onchange = fn;
    input.oninput = fn;
}

function update(){
    [...document.querySelectorAll("input[data-requires]")].forEach(el => {
        let item = el.getAttribute("data-requires");
        console.log(item, settings[item]);
        if (!settings[item]){
            el.setAttribute("disabled", "true");
        } else {
            el.removeAttribute("disabled");
        }
        if (el.getAttribute("data-equals") && settings[item] && settings[item] !== el.getAttribute("data-equals")){
            el.setAttribute("disabled", "true");
        }
    })
    storage.set("settings", settings);
}
})();