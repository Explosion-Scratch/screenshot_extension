const $ = (...a) => document.querySelector(...a);

$("#capture").onclick = capture;

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "status"){
        $("#status").style.display = "block";
        $("#status").innerText = msg.text;
        $("button").innerText = "Capturing..."
        $("button").setAttribute("disabled", "true");
    }
    if (msg.type === "done"){
        $("button").removeAttribute("disabled");
    }
})

function capture(){
    chrome.runtime.sendMessage({type: "capture"});
}