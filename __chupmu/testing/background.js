// background-script.js
"use strict";

function onError(error) {
    console.error(`Error: ${error}`);
}

// function sendMessageToTabs(tab) {
//     browser.tabs.sendMessage(tab.id, { greeting: "Hi from background script" })
//       .then((response) => {
//         console.log("Message from the content script:");
//         console.log(response.response);
//       })
//       .catch(onError);
// }
// browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT })
// .then(tabs => browser.tabs.get(tabs[0].id))
// .then(tab => {
//   sendMessageToTabs(tabs[0]);
// });

// browser.browserAction.onClicked.addListener(() => {
//   browser.tabs
//     .query({
//       currentWindow: true,
//       active: true,
//     })
//     .then(sendMessageToTabs)
//     .catch(onError);
// });


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
function getRawRecordFromIndexedDb(dbStoreName, ids) {
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

// browser.runtime.onMessage.addListener((request) => {
//     if (
//         request["info"] != "chupmu_extension" ||
//         request["source"] != "chupmu_content_script" ||
//         request["target"] != "chupmu_background_script"
//     ) {
//         return;
//     }
//     if (request["reference"] == "get_records") {
//         console.log(`Request C->B: get_records ...`);
//         return handleGetRecords(request["message"])
//             .then(result => {
//                 console.log(result);
//                 return { response: result };
//             })
//             .catch(error => {
//                 console.error('Error retrieving records:', error);
//                 return { error: "Error getting records" };
//             });
//     }
//     // TODO: send msg back to background script to store state
//     // return Promise.resolve({ response: `Chupmu Content script: Done for command '${request["message"]}'` });
// });


//TODO: generalization. For now, hardcoded voz
function handleRequestRecord(message) {
    return new Promise((resolve, reject) => {
        getRawRecordFromIndexedDb(DB_STORE_NAME, message.ids)
            .then(record => {
                // process raw records
                resolve(record);
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
                .then(record => {
                    portFromCS.postMessage({
                        info: "chupmu_extension", reference: "responseRecords",
                        source: "chupmu_background_script", target: "chupmu_content_script",
                        message: record
                    });
                }
            )
        }
        // else if (msg.reference == "") {
        // }
    });
}

browser.runtime.onConnect.addListener(connected);
