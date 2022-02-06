const $ = (...a) => document.querySelector(...a);


chrome.runtime.sendMessage({type: "getImage"}, (msg) => {
    if (msg.type === "image"){
        let img = new Image();
        let blob_url = URL.createObjectURL(toBlob(msg.data));
        img.src = msg.data;
        img.id = "img";
        $("#img_container").appendChild(img);
        img.onclick = () => {
            window.open(blob_url);
        }
        $(".save").onclick = () => {
            var link = document.createElement("a");
            link.download = `Screenshot.${msg.data.split(",")[0].replace("data:image/", "").split(";")[0].trim().toLowerCase()}`;
            link.href = msg.data;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            delete link;
        }
    }
})
function toBlob(dataURI) {
  var byteString = atob(dataURI.split(',')[1]);
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }
  var blob = new Blob([ab], {type: mimeString});
  return blob;
}
/*
(async () => {
    const {theme} = await import("./theme.js");

    chrome.runtime.sendMessage({type: "getImage"}, (msg) => {
        if (msg.type === "image"){
            window.src = msg.data;
            createEditor(msg.data)
        }
    })

    async function loadScripts(scripts){
        for (let a of scripts){
            await l(a);
            console.log(a, "loaded")
        }
        return;
        function l(s){
            return new Promise(res => {
                let script = document.createElement("script");
                script.src = s;
                document.head.appendChild(script);
                script.onload = () => {
                    script.remove();
                    res(s);
                };
            })
        }
    }

    async function createEditor(src){
        console.log({theme});
        let editor = new tui.ImageEditor('#image_editor', {
            includeUI: {
                theme,
                menuBarPosition: 'bottom',
            },
            menu: ['shape', 'filter'],
            initMenu: 'filter',
            uiSize: {
                width: `${window.innerWidth}px`,
                height: `${window.innerHeight}px`
            },
            selectionStyle: {
                cornerSize: 20,
                rotatingPointOffset: 70
            },
            cssMaxWidth: window.innerWidth,
            cssMaxHeight: window.innerHeight,
            usageStatistics: false,
        });
        editor.loadImageFromURL(src, "Screenshot").then(() => {
            console.log("Loaded");
            editor.ui.activeMenuEvent()
            editor.ui.resizeEditor()
        });
        window.editor = editor;
    }
})();
*/