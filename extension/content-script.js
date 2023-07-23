const chupmu_class_prefix = "chupmu_";
const chupmu_css_class_prefix = "chupmu_css_";
const chupmu_css_class_prefix_Regex = /(chupmu_css_)\S*/;

function createTooltipHtml(tootipId, tagnames, note, recordUrl) {
    let str = `
<span class="${chupmu_class_prefix} tooltiptext" id="${tootipId}">
    <p>Tags: ${tagnames}</p>
    <p>Note: ${note}</p>
    <p>View full record: <a href="${recordUrl}">chup-mu.org</a></p>
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
    // BIG TODO: update this function to work with results from multiple filter databases
    data  = data[0]
    let tag_metas = data.meta.tags;
    let records = data.records; // object: {1: { userid: 1, tags: (1) […], note: "" }}
    let dbName = data.meta.dbName;
    let tagnames = [];
    let all_acticles = document.getElementsByClassName("message message--post js-post");
    for (let i = 0; i < all_acticles.length; i++) {
        article = all_acticles[i];
        let a_username = article.getElementsByClassName("username")[0];
        let userid = a_username.getAttribute("href").split(".").pop().replace("/", "");
        if (!userid) continue;
        let record = records[userid];
        if (!record) continue;

        let message_cell_user = article.getElementsByClassName("message-cell message-cell--user")[0];
        for (let j = 0; j < record.tagIds.length; j++) {
            let tag_id = record.tagIds[j];
            if (tag_metas[tag_id]) {
                let tagname = tag_metas[tag_id].tagname;
                message_cell_user.classList.add(`${chupmu_css_class_prefix}_${dbName}__${tagname}`);
                tagnames.push(tagname);
            }
            break; // TODO: support only the first tag for now. Need more css ideas!
        }

        message_cell_user.classList.add("tooltip");
        let tootipId = `chupmu-tooltip-text-uid-${userid}`;
        let tooltipHtml = createTooltipHtml(
            tootipId, tagnames, record.note,
            data.meta.onlineRecordUrlPrefix + userid
        );
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
            askBackgroundForRecords(getAllUserIdsOnPageVoz());
        } else if (msg.message == "removeLabel") {
            console.log("command: removeLabel")
            handleRemoveLabel();
        }
    } else if (msg.reference == "responseRecords") {
        /* Data is a array in form:
        [
            {
                "meta": {
                "dbName": "voz_test_db.12345",
                "description": "A test DB for Voz forum",
                "urls": [
                    "https://voz.vn/t/noi-quy-cua-dien-dan-chi-tiet-tung-muc.1583/",
                    "voz.vn/t/"
                ],
                "dbCss": ".chupmu_css_.voz_test_db.12345_.xao_lol .......}",
                "dbUrl": "https://raw.githubusercontent.com/Que0Le/chupmu/main/__chupmu/test_db/voz_test_db.json"
                },
                "records": {
                "1": {
                    "userid": "1",
                    "tagIds": [
                    "0"
                    ],
                    "note": "Note for @'fRzzy'"
                },
                "42178": {
                    "userid": "42178",
                    "tagIds": [
                    "2",
                    "3"
                    ],
                    "note": "Note for @'thuyvan'"
                }
                }
            }
        ]
        */
        console.log(`Get responseRecords records data from background:`);
        console.log(msg.message)
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
