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
    try {
      let parsedUrl = new URL(currentPickedUrl);
      if (!SUPPORTED_PROTOCOL.includes(parsedUrl.protocol.slice(0, -1))) {
        console.log(`Picker: Only supported '${SUPPORTED_PROTOCOL}' protocols. Url is '${currentPickedUrl}'`);
        return;
      }
      // TODO: improve guessing
      let suggestedPlatformUrl = parsedUrl.origin.replace(parsedUrl.protocol, "").slice(2);
      let suggestedUserId = parsedUrl.pathname.match(getUserFromUrl)[1];

      const handleMessage = (msg) => {
        if (msg.reference === 'getCurrentPickedUrl') {
          return getAllFilterDbNamesAndTheirTagNames()
            .then(dbNamesAndTheirTagNames => ({
              "currentPickedUrl": currentPickedUrl, "availableDbNames": dbNamesAndTheirTagNames,
              "suggestedPlatformUrl": suggestedPlatformUrl, "suggestedUserId": suggestedUserId
            }));
        } else if (msg.reference === 'submitNewUser') {
          browser.runtime.onMessage.removeListener(handleMessage);
          console.log(msg)
        }
      };

      browser.runtime.onMessage.addListener(handleMessage);
      browser.browserAction.openPopup();
    } catch (error) {
      console.log(`Picker: Error parsing url '${currentPickedUrl}'`);
      return;
    }
  }
});


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
      fetch("https://raw.githubusercontent.com/Que0Le/chupmu/main/__chupmu/test_db/voz_test_db.json")
        .then((response) => response.json())
        .then((data) => {
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
      console.log("Request C->B: requestRecords", msg.message);
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
    } else if (msg.reference == "removeCurrentCss") {
      console.log("Request C->B: removeCurrentCss", msg.message);
      msg.message.currentCss.forEach(cc => browser.tabs.removeCSS({ code: cc }));
    }
  });
}

browser.runtime.onConnect.addListener(connected);
