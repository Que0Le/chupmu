// background-script.js
"use strict";

browser.contextMenus.create({
    id: "chupmu_pick_this_user",
    title: "Chupmu: Pick this user ...",
    contexts: ["link"],
},
    // See https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/#event-pages-and-backward-compatibility
    // for information on the purpose of this error capture.
    () => void browser.runtime.lastError,
);

let currentPickedUrl = "";

browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "chupmu_pick_this_user") {
        currentPickedUrl = info.linkUrl;

        // TODO: if supported platform, get all urls for that platform to display to user
        browser.runtime.onMessage.addListener(msg => {
            if (msg.reference === 'getCurrentPickedUrl') return Promise.resolve({"currentPickedUrl": currentPickedUrl});
        });
        browser.browserAction.openPopup()
    }
});


// TODO: move this to local storage, and make it possible to be edited by user
let action_db = {
    "xao_lol": { "background": "pink" },
    "pro": { "background": "green" },
    "ga_con": { "background": "blue" },
    "dot_con_hay_noi": { "background": "red" },
};

// TODO: if not found in local storage, set to TOOLTIP_CSS as default
browser.storage.local.set({ "__TOOLTIP_CSS": { "css": TOOLTIP_CSS } });

/*
When first loaded, initialize the page action for all tabs.
*/
let gettingAllTabs = browser.tabs.query({});
gettingAllTabs.then((tabs) => {
    for (let tab of tabs) {
        initializePageAction(tab);
    }
});

/*
Each time a tab is updated, reset the page action for that tab.
*/
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
    initializePageAction(tab);
});

/* Read Setting */
const META_DB_PREFIX = "meta_db_";
browser.storage.local.get(`${EXT_NAME}_config`).then(config => {
    if (Object.keys(config).length == 0) {
        console.log("No config found. Set to default ...");
        let obj = {};
        obj[`${EXT_NAME}_config`] = DEFAULT_SETTINGS;
        browser.storage.local.set(obj);
    }
});


fetch("https://raw.githubusercontent.com/Que0Le/chupmu/main/__chupmu/test_db/voz_test_db.json")
    .then((response) => response.json())
    .then((data) => {
        console.log(data);
        // Store meta data in local storage
        let meta_db = {};
        meta_db[`${META_DB_PREFIX}${data.meta.dbname}`] = data.meta;
        browser.storage.local.set(meta_db);
        // Write db to indexeddb
        openDb()
            .then(db => {
                const transaction = db.transaction(DB_STORE_NAME, 'readwrite');
                const objectStore = transaction.objectStore(DB_STORE_NAME);
                Object.entries(data["db"]).forEach(([key, value]) => {
                    const request = objectStore.add(value);
                    request.onerror = function (event) {
                        // TODO: better error handler
                        console.error('Error adding data', event.target.error);
                    };
                    request.onsuccess = function (event) {
                        console.log('Data added successfully');
                    };
                });
                transaction.oncomplete = function () {
                    console.log('Transaction completed');
                    db.close();
                };
            })
            .catch(error => {
                console.error('Error opening database:', error);
            });
    });


/**
 * Fired when a registered command is activated using a keyboard shortcut.
 *
 * In this sample extension, there is only one registered command: "Ctrl+Shift+U".
 * On Mac, this command will automatically be converted to "Command+Shift+U".
 */
browser.commands.onCommand.addListener((command) => {
    browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT })
        .then(tabs => browser.tabs.get(tabs[0].id))
        .then(tab => {
            toggleLabelify(tab);
        });
});


/*
Toggle CSS when the page action is clicked.
*/
browser.pageAction.onClicked.addListener(toggleLabelify);

/**
 * 
 * @param {Int[]} ids Array of user id. Integer, but wil be changed to support i.e uuid
 * @returns Array of record objects
 */
function getRawRecordsFromIndexedDb(dbStoreName, ids) {
    return new Promise((resolve, reject) => {
        console.log(`getting records for id: `, ids);
        openDb()
            .then(db => {
                const transaction = db.transaction(dbStoreName, 'readonly');
                const objectStore = transaction.objectStore(dbStoreName);

                let result = {};
                const getPromises = ids.map(id => {
                    return new Promise((resolve, reject) => {
                        const request = objectStore.get(id);
                        request.onerror = function (event) {
                            console.error('Error reading data', event.target.error);
                            reject(event.target.error);
                        };
                        request.onsuccess = function (event) {
                            const data = event.target.result;
                            if (data) {
                                // console.log('Data read successfully:', data);
                                result[id] = data;
                            }
                            resolve();
                        };
                    });
                });

                Promise.all(getPromises)
                    .then(() => {
                        db.close();
                        resolve(result);
                    })
                    .catch(error => {
                        db.close();
                        reject(error);
                    });
            })
            .catch(error => {
                console.error('Error opening database:', error);
                reject(error);
            });
    });
}

//TODO: generalization. For now, hardcoded voz
// { currentUrl: "https://voz.vn/t/...", ids: (6) […] }
function handleRequestRecord(message) {
    return new Promise((resolve, reject) => {
        getRawRecordsFromIndexedDb(DB_STORE_NAME, message.ids)
            .then(records => {
                console.log(records)
                browser.storage.local.get(`${META_DB_PREFIX}${DB_STORE_NAME}`)
                    .then(meta => {
                        let result = { meta: meta[`${META_DB_PREFIX}${DB_STORE_NAME}`], records: records };
                        resolve(result);
                    })
                    .catch(error => {
                        reject(error);
                    });
            })
            .catch(error => {
                reject(error);
            });
    });
}

// TODO: support multiple content script
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#connection-based_messaging
let portFromCS;

function connected(p) {
    portFromCS = p;
    portFromCS.onMessage.addListener((msg) => {
        if (msg.info != "chupmu_extension" ||
            msg.source != "chupmu_content_script" ||
            msg.target != "chupmu_background_script") {
            return;
        }

        if (msg.reference == "requestRecords") {
            console.log("Request C->B: requestRecords ...");
            console.log(msg.message)
            handleRequestRecord(msg.message)
                .then(result => {
                    portFromCS.postMessage({
                        info: "chupmu_extension", reference: "responseRecords",
                        source: "chupmu_background_script", target: "chupmu_content_script",
                        message: result
                    });
                })
        }
        // else if (msg.reference == "") {
        // }
    });
}

browser.runtime.onConnect.addListener(connected);
