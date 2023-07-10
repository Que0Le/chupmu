const chupmu_class_prefix = "chupmu_";
const chupmu_css_class_prefix = "chupmu_css_";
const chupmu_css_class_prefix_Regex = /(chupmu_css_)\S*/;


function onError(error) {
    console.log(`Error: ${error}`);
}

function createTooltipHtml(tootipId, record) {
    let str = `
<span class="${chupmu_class_prefix} tooltiptext" id="${tootipId}">
    <p>Tags: ${record["tags"]}</p>
    <p>View full record: <a href="${record["recordUrl"]}">chup-mu.org</a></p>
</span>
`
    return str;
}


/**
 * 
 * @returns {String[]}
 */
function getAllUserIdsOnPageVoz() {
    let all_acticles = document.getElementsByClassName("message message--post js-post");
    let userIds = [];
    for (let i = 0; i < all_acticles.length; i++) {
        article = all_acticles[i];
        let a_username = article.getElementsByClassName("username")[0];
        let userid = a_username.getAttribute("href").split(".").pop().replace("/", "");
        if (userid) {
            userIds.push(userid);
        }
    };
    return userIds.filter((item, index) => userIds.indexOf(item) === index);
}

function applyLabel(data) {
    let tag_meta = data.meta.tags;
    let records = data.records; // object: {1: { userid: 1, tags: (1) […], note: "" }}
    console.log(data)
    console.log(records)
    let all_acticles = document.getElementsByClassName("message message--post js-post");
    for (let i = 0; i < all_acticles.length; i++) {
        article = all_acticles[i];
        let a_username = article.getElementsByClassName("username")[0];
        let userid = a_username.getAttribute("href").split(".").pop().replace("/", "");
        if (!userid) continue;
        let record = records[userid];
        if (!record) continue;
        console.log(record);

        let message_cell_user = article.getElementsByClassName("message-cell message-cell--user")[0];
        for (let j = 0; j < record.tagIds.length; j++) { 
            let tag_id = record.tagIds[j];
            if (tag_id) {
                let tag = tag_meta[tag_id].tag;
                message_cell_user.classList.add(`${chupmu_css_class_prefix}${tag}`);
            }
            break; // TODO: support only the first tag for now. Need more css ideas!
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
            askBackgroundForRecords(getAllUserIdsOnPageVoz());
        } else if (msg.message == "removeLabel") {
            console.log("command: removeLabel")
            //         handleRemoveLabel();
        }
    } else if (msg.reference == "responseRecords") {
        console.log(`Get records data from background:`);
        // console.log(msg.message);
        applyLabel(msg.message);
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
