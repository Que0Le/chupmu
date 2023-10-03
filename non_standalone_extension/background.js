"use strict";

/* Set default Setting */
// browser.storage.local.get(`${EXT_NAME}_config`)
//   .then(data => {
//     if (Object.keys(data).length == 0) {
//       console.log("No config found. Set to default ...");
//       let obj = {};
//       obj[`${EXT_NAME}_config`] = DEFAULT_SETTINGS;
//       browser.storage.local.set(obj);
//     }
//   })
//   .then();
async function initializeConfig() {
  const data = await browser.storage.local.get(`${EXT_NAME}_config`);
  if (Object.keys(data).length === 0) {
    console.log("No config found. Set to default ...");
    const obj = {};
    obj[`${EXT_NAME}_config`] = DEFAULT_SETTINGS;
    await browser.storage.local.set(obj);
  }
}

/*
Each time a tab is updated, reset the page action for that tab.
*/
// browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
//   initializePageAction(tab);
// });
async function initializePageActionOnUpdated(tabId, changeInfo, tab) {
  await initializePageAction(tab);
}



/*
When first loaded, initialize the page action (icon on the url bar) for all tabs.
*/
// let gettingAllTabs = browser.tabs.query({});
// gettingAllTabs.then((tabs) => {
//   for (let tab of tabs) {
//     initializePageAction(tab);
//   }
// });
async function initializePageActionAllSupportedTabs() {
  const tabs = await browser.tabs.query({});
  for (let tab of tabs) {
    let currentUrl = await isUrlSupported(tab.url);
    if (currentUrl) {
      initializePageAction(tab);
    }
  }
}


(async () => {
  await initializeConfig();
  await initializePageActionAllSupportedTabs();
  await browser.tabs.onUpdated.addListener(initializePageActionOnUpdated);
})();



// TODO: support multiple content script
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/
// WebExtensions/Content_scripts#connection-based_messaging
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
  // See 
  // https://extensionworkshop.com/documentation/develop/
  // manifest-v3-migration-guide/#event-pages-and-backward-compatibility
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


/**
 * Fired when a registered command is activated using a keyboard shortcut.
 *
 * In this sample extension, there is only one registered command: "Ctrl+Shift+U".
 * On Mac, this command will automatically be converted to "Command+Shift+U".
 */
// browser.commands.onCommand.addListener((command) => {
//   browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT })
//     .then(tabs => {
//       let tab = tabs[0]
//       function onExecuted(result) {
//         console.log(`We executed in tab 2`, result);
//       }
      
//       function onError(error) {
//         console.log(`Error: ${error}`);
//       }
      
//       const executing = browser.tabs.executeScript(
//         tab.id, 
//         {
//         file: "./sites/stackoverflow_question/content-script.js",
//         }
//       );
//       executing.then(onExecuted, onError);
//     });
// });

browser.commands.onCommand.addListener(async (command) => {
  let currentUrl = await isUrlSupported(await getCurrentTabUrl());
  if (!currentUrl) return;

  const [tab] = await browser.tabs.query({
    active: true, windowId: browser.windows.WINDOW_ID_CURRENT
  });

  const onError = (error) => console.log(
    `Error injecting script in tab ${tab.id}: ${error}
    `);

  const onExecuted = (result) => {
    console.log(`Injected script in tab ${tab.id}: ${currentUrl}`);
    toggleLabelify(tab);
  };

  const executing = browser.tabs.executeScript(
    tab.id, { file: "./sites/stackoverflow_question/cs-so-quest.js" }
  );
  executing.then(onExecuted, onError);
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
      } else if (message.reference === "responsePickedItems") {

        function captureAndPush(rect, url) {
          const imageDetails = { format: "png", quality: 100, rect: rect, scale: 1.0 };
          
          return browser.tabs.captureVisibleTab(imageDetails)
            .then(dataUrl => ({
              dataUrl: dataUrl,
              captureUrl: url
            }))
            .catch(error => {
              console.error("Error capturing visible tab:", error);
              return null;
            });
        }
      
        browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT })
          .then(tabs => {
            const url = tabs[0].url;
            const capturePromises = message.message.imgRects.map(rect => captureAndPush(rect, url));
            
            Promise.all(capturePromises)
              .then(results => {
                const validResults = results.filter(result => result !== null);
                sendMsgToSidebar("responsePickedItems", { 
                  "pickedItemPng": validResults, unixTime: Date.now() 
                });
              })
              .catch(error => {
                console.error("Error capturing DOM screenshots:", error);
              });
          })
          .catch(error => console.log("Error querying active tab: ", error));
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
        handleSubmitNewUserToDb(message.message);
      } else if (message.reference === "togglePicker") {
        console.log(`SB->B: `, message.reference);
        sendMsgToContent("togglePicker", {});
      } else if (message.reference === "requestPickedItems") {
        console.log(`SB->B: `, message.reference);
        sendMsgToContent("requestPickedItems", {});
      } else if (message.reference === "clearPickedItems") {
        console.log(`SB->B: `, message.reference);
        sendMsgToContent("clearPickedItems", {});
      }    
    });
  }
}

browser.runtime.onConnect.addListener(connected);
