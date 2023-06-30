

// https://voz.vn/t/noi-quy-cua-dien-dan-chi-tiet-tung-muc.1583/
let userid_db = {
    1: { "tags": ["xao_lol"] },
    71866: { "tags": ["ga_con"] },
    42178: { "tags": ["pro", "hieu_biet"] },
    1815170: { "tags": ["ga_con"] },
    1453845: { "tags": ["xao_lol", "dot_con_hay_noi"] },
    1749431: { "tags": ["xao_lol", "dot_con_hay_noi"] },
};

let action_db = {
    "xao_lol": { "background": "pink" },
    "pro": { "background": "green" },
    "ga_con": { "background": "blue" },
    "dot_con_hay_noi": { "background": "red" },
};

let keys = Object.keys(userid_db);
console.log({keys: keys})

function onError(error) {
    console.log(`Error: ${error}`);
}

browser.runtime.onMessage.addListener((request) => {
    // TODO: send msg back to background script to store state
    console.log("Message from the background script:");
    console.log(request.greeting);
    console.log("ting tong");
    let all_acticles = document.getElementsByClassName("message message--post js-post");
    for (let i=0; i<all_acticles.length; i++) {
        article = all_acticles[i];
        let a_username = article.getElementsByClassName("username")[0];
        let userid = parseInt(a_username.getAttribute("href").split(".").pop().replace("/", ""));
        if (!userid) continue;
        let record = userid_db[userid]
        if (!record) continue;

        let message_cell_user = article.getElementsByClassName("message-cell message-cell--user")[0];
        for (let j=0; j<record["tags"].length; j++) {
            let tag = record["tags"][j];
            let action = action_db[tag]
            if (!action) continue;
            let style_str = message_cell_user.getAttribute('style') ? message_cell_user.getAttribute('style') + `;background:${action["background"]};` : `background:${action["background"]};`
            message_cell_user.setAttribute('style', style_str);
        }

        /* add tool tip */
        message_cell_user.classList.add("tooltip");
        let tootip_id = `chupmu-tooltip-text-uid-${userid}`;
        message_cell_user.innerHTML += `<span class="tooltiptext" id="${tootip_id}">Tags: ${record["tags"]}</span>`;
        let tooltip = document.getElementById(tootip_id);
        if (!tooltip) console.log(`Failed adding tooltip id: ${tootip_id}`);
    };
    return Promise.resolve({ response: "Hi from content script" });
  });
