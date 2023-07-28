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
      if (msg.reference === 'getCurrentPickedUrl') return Promise.resolve({ "currentPickedUrl": currentPickedUrl });
    });
    browser.browserAction.openPopup()
  }
});


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
              const transaction = db.transaction(data.meta.dbName, 'readwrite');
              const objectStore = transaction.objectStore(data.meta.dbName);
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
      handleRequestRecord(msg.message)
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
