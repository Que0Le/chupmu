"use strict";

// TODO: support multiple content script
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#connection-based_messaging
let portChannelContent;
let portChannelSidebar;

/**
 * 
 * @param {String} reference 
 * @param {Object} message 
 */
function sendMsgToContent(reference, message) {
  portChannelContent.postMessage({
    info: MSG_EXT_NAME, reference: reference,
    source: MSG_TARGET_BACKGROUND, target: MSG_TARGET_CONTENT,
    message: message
  });
}

/**
 * 
 * @param {String} reference 
 * @param {Object} message 
 */
function sendMsgToSidebar(reference, message) {
  portChannelSidebar.postMessage({
    info: MSG_EXT_NAME, reference: reference,
    source: MSG_TARGET_BACKGROUND, target: MSG_TARGET_SIDEBAR,
    message: message
  });
}

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
    browser.sidebarAction.open();
    sendMsgToSidebar("forceReloadSidebar", {});
  }
});


/*
When first loaded, initialize the page action (icon on the url bar) for all tabs.
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
      fetch("https://raw.githubusercontent.com/Que0Le/MicGa_data/main/voz_test_db.json")
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

// TODO: inject css using tab id: sender.sender.tab.id
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/insertCSS
function connected(p) {
  if (p && p.name === "port-cs") {
    portChannelContent = p;
    portChannelContent.onMessage.addListener((message, sender) => {
      if (message.info != "chupmu_extension" ||
        message.source != "chupmu_content_script" ||
        message.target != "chupmu_background_script") {
        console.log("B: unknown message: ", message);
        return;
      }

      if (message.reference == "requestRecords") {
        console.log("Request C->B: requestRecords", message.message);
        handleRequestRecord(message.message)
          .then(results => {
            results.forEach(r => {
              browser.tabs.insertCSS({ code: r.meta.dbCss });
            });
            sendMsgToContent("responseRecords", results);
          }
          );
      } else if (message.reference == "removeCurrentCss") {
        console.log("Request C->B: removeCurrentCss", message.message);
        message.message.currentCss.forEach(cc => browser.tabs.removeCSS({ code: cc }));
      } else if (message.reference == "responsePickedItems") {
        let result = [];
        
        function captureAndPush(rect) {
          const imageDetails = { format: "png", quality: 100, rect: rect, scale: 1.0 };
          return browser.tabs.captureVisibleTab(imageDetails)
            .then((dataUrl) => {
              result.push(dataUrl);
              console.log(dataUrl);
            });
        }
        Promise.all(message.message.imgSources.map(captureAndPush))
          .then(() => {
            // Once all captures are complete, send the result to the sidebar
            sendMsgToSidebar("responsePickedItems", { "pickedItemPng": result });
          })
          .catch((error) => {
            console.error("Error capturing DOM screenshots:", error);
          });
      }
    });
  } else if (p && p.name === "port-sidebar") {
    portChannelSidebar = p;
    portChannelSidebar.onMessage.addListener((message, sender) => {
      if (message.source !== "chupmu_sidebar_script") {
        console.log("Warning B: portChannelSidebar received messsage from unknown source: ", message);
        return
      }
      if (message.reference === 'getCurrentPickedUrl') {
        try {
          let parsedUrl = new URL(currentPickedUrl);
          if (!SUPPORTED_PROTOCOL.includes(parsedUrl.protocol.slice(0, -1))) {
            console.log(`Picker: Only supported '${SUPPORTED_PROTOCOL}' protocols. Url is '${currentPickedUrl}'`);
            return;
          }
          // TODO: improve guessing
          let suggestedPlatformUrl = parsedUrl.origin.replace(parsedUrl.protocol, "").slice(2);
          let suggestedUserId = parsedUrl.pathname.match(getUserFromUrl)[1];
          getAllFilterDbNamesAndTheirTags(true)
            .then(dbNamesAndTheirTagNames => {
              sendMsgToSidebar("responseGetCurrentPickedUrl",
                {
                  "currentPickedUrl": currentPickedUrl, "dbNamesAndTheirTagNames": dbNamesAndTheirTagNames,
                  "suggestedPlatformUrl": suggestedPlatformUrl, "suggestedUserId": suggestedUserId
                }
              );
            });
        } catch (error) {
          console.log(`Picker: Error parsing url '${currentPickedUrl}'`);
          return Promise.resolve({ error: `Failed parsing url: '${currentPickedUrl}'` });
        }
      } else if (message.reference === 'submitNewUser') {
        handleSubmitNewUserToDb(message.data);
      } else if (message.reference === "togglePicker") {
        console.log(`SB->B: `, message.reference);
        sendMsgToContent("togglePicker", {});
      } else if (message.reference === "requestPickedItems") {
        console.log(`SB->B: `, message.reference);
        browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT })
        .then(tabs => {
          browser.tabs.executeScript(tabs[0].id, {
            file: 'sidebar/html2canvas.min.js'
          });
        });
        sendMsgToContent("requestPickedItems", {})
      }
    })
  }
}

browser.runtime.onConnect.addListener(connected);
