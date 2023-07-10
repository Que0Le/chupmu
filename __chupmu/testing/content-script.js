const chupmu_class_prefix = "chupmu_";
const chupmu_css_class_prefix = "chupmu_css_";
const chupmu_css_class_prefix_Regex = /(chupmu_css_)\S*/;


function onError(error) {
    console.log(`Error: ${error}`);
}
/* 
function createTooltipHtml(tootipId, record) {
    let str = `
<span class="${chupmu_class_prefix} tooltiptext" id="${tootipId}">
    <p>Tags: ${record["tags"]}</p>
    <p>View full record: <a href="${record["recordUrl"]}">chup-mu.org</a></p>
</span>
`
    return str;
}

function handleLabel(dbStorage) {
    // TODO: handle errors
    console.log({dbStorage: dbStorage});
    const tagObj = {};
    dbStorage["meta"]["tags"].forEach(tag => {
        tagObj[tag.id] = tag.tag;
    });
    let all_acticles = document.getElementsByClassName("message message--post js-post");
    for (let i = 0; i < all_acticles.length; i++) {
        article = all_acticles[i];
        let a_username = article.getElementsByClassName("username")[0];
        let userid = a_username.getAttribute("href").split(".").pop().replace("/", "");
        if (!userid) continue;
        let record = dbStorage["db"][userid]
        if (!record) continue;

        let message_cell_user = article.getElementsByClassName("message-cell message-cell--user")[0];
        for (let j = 0; j < record["tags"].length; j++) { // support only 1 tag for now
            let tag_id = record["tags"][j];
            let tag = tagObj[tag_id];
            // let action = action_db[tag]
            // if (!action) continue;
            // let style_str = message_cell_user.getAttribute('style') ? message_cell_user.getAttribute('style') + `;background:${action["background"]};` : `background:${action["background"]};`
            message_cell_user.classList.add(`${chupmu_css_class_prefix}${tag}`);
            // message_cell_user.setAttribute('style', style_str);
        }

        message_cell_user.classList.add("tooltip");
        let tootipId = `chupmu-tooltip-text-uid-${userid}`;
        let tooltipHtml = createTooltipHtml(tootipId, record)
        message_cell_user.innerHTML += tooltipHtml;
        let tooltip = document.getElementById(tootipId);
        if (!tooltip) console.log(`Failed adding tooltip id: ${tootipId}`);
    };
}

function handleRemoveLabel() {
    // Remove css
    let divs = document.querySelectorAll(`div[class^="${chupmu_css_class_prefix}"]`);
    for (let i = 0; i < divs.length; i++) {
        divs[i].classList.remove(chupmu_css_class_prefix_Regex.exec(divs[i].className)[0]);
    }
    // Tooltips
    const elements = document.getElementsByClassName(chupmu_class_prefix);
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
}
*/
let myPort = browser.runtime.connect({ name: "port-from-cs" });
myPort.postMessage({ greeting: "hello from content script" });

myPort.onMessage.addListener((msg) => {
    if (msg.info != "chupmu_extension" ||
        msg.source != "chupmu_background_script" ||
        msg.target != "chupmu_content_script") {
        return;
    }

    if (msg.reference == "toggleLabelify") {
        console.log("Request B->C: toggleLabelify ...");
        // myPort.postMessage({ response: `Chupmu Content script: Working on command '${msg.message}'` });
        if (msg.message ==  "label") {
            console.log("command: label")
            //         handleLabel(db);
            askBackgroundForRecords([1, 2, 3, 4]);
        } else if (msg.message == "removeLabel") {
            console.log("command: removeLabel")
            //         handleRemoveLabel();
        }
    } else if (msg.reference == "responseRecords") {
        console.log(`records from background:`);
        console.log(msg.message)
    }

});

function askBackgroundForRecords(ids) {
    myPort.postMessage(
        {
            info: "chupmu_extension", reference: "requestRecords",
            source: "chupmu_content_script", target: "chupmu_background_script",
            message: { "currentUrl": document.location.href, "ids": ids }
        });
}

// function sendMsgToBackground(reference, msg) {
//     browser.runtime
//         .sendMessage(
//             null,
//             {
//                 info: "chupmu_extension", reference: reference,
//                 source: "chupmu_content_script", target: "chupmu_background_script",
//                 message: msg
//             })
//         .then((response) => {
//             console.log(`Answer B->C:`);
//             console.log(response.response);
//         })
//         .catch(onError);
// }


// function handleLabel(dbStorage) {
//     console.log("handleLabel");
// }

// function handleRemoveLabel() {
//     console.log("handleRemoveLabel")
// }

// browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request["info"] != "chupmu_extension" ||
//         request["source"] != "chupmu_background_script" ||
//         request["target"] != "chupmu_content_script") {
//         return;
//     }

//     if (request["reference"] == "toggleLabelify") {
//         console.log("Request B->C: toggleLabelify ...");
//         // browser.runtime.sendMessage({ response: `Chupmu Content script: Done for command '${request["message"]}'` });
//         sendResponse({ response: `Chupmu Content script: Done for command '${request["message"]}'` });
//         askBackgroundForRecords([1, 2, 3, 4]);

//         // const gettingDbStorage = browser.storage.local.get();
//         // gettingDbStorage.then(db => {
//         //     if (request["message"] == "label") {
//         //         handleLabel(db);
//         //     } else if (request["message"] == "remove_label") {
//         //         handleRemoveLabel();
//         //     }
//         // }, onError);
//     }


//     // TODO: send msg back to background script to store state
//     // return Promise.resolve({ response: `Chupmu Content script: Done for command '${request["message"]}'` })
// });
// askBackgroundForRecords([1, 2, 3, 4]);
