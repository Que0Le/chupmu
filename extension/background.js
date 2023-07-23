"use strict";

/* Create context menu for picker */
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

/* Set default Setting */
browser.storage.local.get(`${EXT_NAME}_config`)
    .then(data => {
        if (Object.keys(data).length == 0) {
            console.log("No config found. Set to default ...");
            let obj = {};
            obj[`${EXT_NAME}_config`] = DEFAULT_SETTINGS;
            browser.storage.local.set(obj);
            /* Download DB */
            // const META_DB_PREFIX = "meta_db_";
            fetch("https://raw.githubusercontent.com/Que0Le/chupmu/main/__chupmu/test_db/voz_test_db.json")
                .then((response) => response.json())
                .then((data) => {
                    // console.log(data);
                    // Store meta data in local storage
                    // let meta_db = {};
                    // meta_db[`${META_DB_PREFIX}${data.meta.dbName}`] = data.meta;
                    // browser.storage.local.set(meta_db);
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
        }
    })
    .then(() => {
        // Generate matching URL set
        browser.storage.local.get(`${EXT_NAME}_config`).then(data => {
            let config = data[`${EXT_NAME}_config`];
            reloadSupportedUrl(config);
        });
    })


/* Get filter databases that support this url */
// TODO: more sophisticated solution to filter out supported url-set
/**
 * 
 * @param {String} url 
 * @returns Array of dbName strings
 */
function getFilterDbsForUrl(url) {
    return new Promise((resolve, reject) => {
        let supportedDb = [];
        browser.storage.local.get(`${EXT_NAME}_dbUrls`).then(data => {
            let supportedUrls = data[`${EXT_NAME}_dbUrls`];
            Object.entries(supportedUrls).forEach(([platformUrl, databaseNames]) => {
                if (url.includes(platformUrl)) {
                    supportedDb.push(...databaseNames);
                }
            });
            resolve([...new Set(supportedDb)]);
        }).catch(error => {
            reject(error);
        });
    });
}


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

/* The same if the pageaction icon is clicked */
browser.pageAction.onClicked.addListener(toggleLabelify);

/**
 * 
 * @param {Int[]} ids Array of user id. Integer, but wil be changed to support i.e uuid
 * @returns Array of record objects
 */
function getRawRecordsFromIndexedDb(dbStoreName, ids) {
    return new Promise((resolve, reject) => {
        // console.log(`getting records (if any) for id set: `, ids, dbStoreName);
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

function handleRequestRecord3(message) {
    return new Promise((resolve, reject) => {
        let results = [];
        browser.storage.local.get(`${EXT_NAME}_config`)
        .then(data => data[`${EXT_NAME}_config`])
        .then(config => {
            getFilterDbsForUrl(message.currentUrl)
                .then(supportedDbs => {
                    const promiseArray = supportedDbs.map(supportedDb => {
                        return getRawRecordsFromIndexedDb(supportedDb, message.ids)
                            .then(records => {
                                let resultForThisDb = { 
                                    meta: config.dbSources.filter(dbs => dbs.dbName == supportedDb)[0], 
                                    records: records 
                                };
                                results.push(resultForThisDb);
                            });
                    });
                    Promise.all(promiseArray)
                        .then(() => {
                            resolve(results); // Resolve the outer Promise with the results
                        })
                        .catch(error => {
                            console.error("An error occurred:", error);
                            reject(error);
                        });
                })
                .catch(error => {
                    console.error("An error occurred:", error);
                    reject(error);
                });
        })
        .catch(error => {
            console.error("An error occurred:", error);
            reject(error);
        });
    });
}

// TODO: support multiple content script
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#connection-based_messaging
let portFromCS;

// TODO: inject css using tab id: sender.sender.tab.id
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/insertCSS
function connected(p) {
    portFromCS = p;
    portFromCS.onMessage.addListener((msg, sender) => {
        if (msg.info != "chupmu_extension" ||
            msg.source != "chupmu_content_script" ||
            msg.target != "chupmu_background_script") {
            return;
        }

        if (msg.reference == "requestRecords") {
            console.log("Request C->B: requestRecords ...");
            console.log(msg.message)
            handleRequestRecord3(msg.message)
                .then(results => {
                    results.forEach(r => {
                        browser.tabs.insertCSS({ code: r.meta.dbCss });
                    });
                    portFromCS.postMessage({
                        info: "chupmu_extension", reference: "responseRecords",
                        source: "chupmu_background_script", target: "chupmu_content_script",
                        message: results
                    });
                }
            );
        } else if (msg.reference == "currentCss") {
            msg.message.currentCss.forEach(cc => browser.tabs.removeCSS({ code: cc }));
        }
        // else if (msg.reference == "") {
        // }
    });
}

browser.runtime.onConnect.addListener(connected);
