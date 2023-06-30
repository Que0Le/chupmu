

// https://voz.vn/t/noi-quy-cua-dien-dan-chi-tiet-tung-muc.1583/
// let userid_db = {
//     1: { "tags": ["xao_lol"] },
//     71866: { "tags": ["ga_con"] },
//     42178: { "tags": ["pro", "hieu_biet"] },
//     1815170: { "tags": ["ga_con"] },
//     1453845: { "tags": ["xao_lol", "dot_con_hay_noi"] },
//     1749431: { "tags": ["xao_lol", "dot_con_hay_noi"] },
// };

// TODO: move this to local storage, and make it possible to be edited by user
let action_db = {
    "xao_lol": { "background": "pink" },
    "pro": { "background": "green" },
    "ga_con": { "background": "blue" },
    "dot_con_hay_noi": { "background": "red" },
};

// let keys = Object.keys(userid_db);
// console.log({ keys: keys })

function onError(error) {
    console.log(`Error: ${error}`);
}

function createTooltipHtml(tootipId, record) {
    let str = `
<span class="tooltiptext" id="${tootipId}">
    <p>Tags: ${record["tags"]}</p>
    <p>View full record: <a href="${record["recordUrl"]}">chup-mu.org</a></p>
</span>
`
    return str;
}

function handleChupMu(dbStorage) {
    let all_acticles = document.getElementsByClassName("message message--post js-post");
    for (let i = 0; i < all_acticles.length; i++) {
        article = all_acticles[i];
        let a_username = article.getElementsByClassName("username")[0];
        let userid = a_username.getAttribute("href").split(".").pop().replace("/", "");
        // let userid = parseInt(a_username.getAttribute("href").split(".").pop().replace("/", ""));
        if (!userid) continue;
        let record = dbStorage[userid]
        if (!record) continue;

        let message_cell_user = article.getElementsByClassName("message-cell message-cell--user")[0];
        for (let j = 0; j < record["tags"].length; j++) {
            let tag = record["tags"][j];
            let action = action_db[tag]
            if (!action) continue;
            let style_str = message_cell_user.getAttribute('style') ? message_cell_user.getAttribute('style') + `;background:${action["background"]};` : `background:${action["background"]};`
            message_cell_user.setAttribute('style', style_str);
        }

        /* add tool tip */
        message_cell_user.classList.add("tooltip");
        let tootipId = `chupmu-tooltip-text-uid-${userid}`;
        let tooltipHtml = createTooltipHtml(tootipId, record)
        message_cell_user.innerHTML += tooltipHtml;
        let tooltip = document.getElementById(tootipId);
        if (!tooltip) console.log(`Failed adding tooltip id: ${tootipId}`);
    };
}

browser.runtime.onMessage.addListener((request) => {
    console.log("Message from the background script:");
    console.log(request.greeting);
    console.log("ting tong");

    const gettingDbStorage = browser.storage.local.get();
    gettingDbStorage.then(handleChupMu, onError);

    // TODO: send msg back to background script to store state
    return Promise.resolve({ response: "Hi from content script" });
});
