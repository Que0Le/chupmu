"use strict";

let dbOnlineQueryUrl = "";

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

  let data = await browser.storage.local.get(`${EXT_NAME}_config`);
  dbOnlineQueryUrl = data.chupmu_config.dbSources[0].dbOnlineQueryUrl;
  console.log(`dbOnlineQueryUrl: ${dbOnlineQueryUrl}`);
})();



// TODO: support multiple content script
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/
// WebExtensions/Content_scripts#connection-based_messaging
let portChannelContent;
let portChannelSidebar;

/**
 * Sends a message to the content script.
 * 
 * @param {String} reference - The reference for the message.
 * @param {Object} message - The message to send.
 * @returns {Promise} - A Promise that resolves when the message is sent.
 */
async function sendMsgToContent(reference, message) {
  return new Promise((resolve) => {
    portChannelContent.postMessage({
      info: MSG_EXT_NAME,
      reference: reference,
      source: MSG_TARGET_BACKGROUND,
      target: MSG_TARGET_CONTENT,
      message: message,
    });
    resolve();
  });
}

/**
 * Sends a message to the sidebar script.
 * 
 * @param {String} reference - The reference for the message.
 * @param {Object} message - The message to send.
 * @returns {Promise} - A Promise that resolves when the message is sent.
 */
async function sendMsgToSidebar(reference, message) {
  return new Promise((resolve) => {
    portChannelSidebar.postMessage({
      info: MSG_EXT_NAME,
      reference: reference,
      source: MSG_TARGET_BACKGROUND,
      target: MSG_TARGET_SIDEBAR,
      message: message,
    });
    resolve();
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


async function handleLabelifySignal() {
  const [currentUrl, supportedUrl, contentScriptPath] = await
    isUrlSupported(await getCurrentTabUrl());
  if (!supportedUrl) return;

  const [tab] = await browser.tabs.query({
    active: true, windowId: browser.windows.WINDOW_ID_CURRENT
  });

  await toggleLabelify(tab, currentUrl, contentScriptPath);

  // const onError = (error) => console.log(
  //   `Error injecting script in tab ${tab.id}: ${error}
  //   `);

  // const onExecuted = (result) => {
  //   console.log(`Injected script in tab ${tab.id}: ${currentUrl}`);
  //   toggleLabelify(tab);
  // };

  // const executing = browser.tabs.executeScript(
  //   tab.id, { file: contentScriptPath }
  // );
  // executing.then(onExecuted, onError);
}

/**
 * Fired when a registered command is activated using a keyboard shortcut.
 *
 * In this sample extension, there is only one registered command: "Ctrl+Shift+U".
 * On Mac, this command will automatically be converted to "Command+Shift+U".
 */
browser.commands.onCommand.addListener(handleLabelifySignal);
/* The same if the pageaction icon is clicked */
browser.pageAction.onClicked.addListener(handleLabelifySignal);

async function connected(p) {
  if (p && p.name === "port-cs") {
    portChannelContent = p;
    portChannelContent.onMessage.addListener(async (message, sender) => {
      if (
        message.info != "chupmu_extension" ||
        message.source != "chupmu_content_script" ||
        message.target != "chupmu_background_script"
      ) {
        console.log("B: unknown message: ", message);
        return;
      }

      if (message.reference == "requestRecords") {
        console.log("Request C->B: requestRecords", message.message);
        try {
          const reportedUsers = await get_reported_users_from_remote(
            dbOnlineQueryUrl,
            API_GET_RUSERS,
            message.message.userids,
            "stackoverflow.com"
          );
          console.log(reportedUsers);
          await sendMsgToContent("responseRecords", reportedUsers);
        } catch (error) {
          console.error("Error fetching reported users:", error);
        }
      } else if (message.reference === "responsePickedItems") {
        async function captureAndPush(rect, url) {
          const imageDetails = { format: "png", quality: 100, rect: rect, scale: 1.0 };

          try {
            const dataUrl = await browser.tabs.captureVisibleTab(imageDetails);
            return {
              dataUrl: dataUrl,
              captureUrl: url,
            };
          } catch (error) {
            console.error("Error capturing visible tab:", error);
            return null;
          }
        }

        try {
          const tabs = await browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT });
          const url = tabs[0].url;
          const capturePromises = message.message.imgRects.map((rect) => captureAndPush(rect, url));

          try {
            const results = await Promise.all(capturePromises);
            const validResults = results.filter((result) => result !== null);
            await sendMsgToSidebar("responsePickedItems", {
              pickedItemPng: validResults,
              unixTime: Date.now(),
            });
          } catch (error) {
            console.error("Error capturing DOM screenshots:", error);
          }
        } catch (error) {
          console.error("Error querying active tab: ", error);
        }
      }
    });
  } else if (p && p.name === "port-sidebar") {
    portChannelSidebar = p;
    portChannelSidebar.onMessage.addListener(async (message, sender) => {
      if (message.source !== "chupmu_sidebar_script") {
        console.log("Warning B: portChannelSidebar received message from unknown source: ", message);
        return;
      }
      if (message.reference === "getCurrentPickedUrl") {
        try {
          let parsedUrl = new URL(currentPickedUrl);
          if (!SUPPORTED_PROTOCOL.includes(parsedUrl.protocol.slice(0, -1))) {
            console.log(`Picker: Only supported '${SUPPORTED_PROTOCOL}' protocols. Url is '${currentPickedUrl}'`);
            return;
          }
          // TODO: improve guessing
          let suggestedPlatformUrl = parsedUrl.origin.replace(parsedUrl.protocol, "").slice(2);
          let suggestedUserId = parsedUrl.pathname.match(getUserFromUrl)[1];

          try {
            const dbNamesAndTheirTagNames = await getAllFilterDbNamesAndTheirTags(true);
            await sendMsgToSidebar("responseGetCurrentPickedUrl", {
              currentPickedUrl: currentPickedUrl,
              dbNamesAndTheirTagNames: dbNamesAndTheirTagNames,
              suggestedPlatformUrl: suggestedPlatformUrl,
              suggestedUserId: suggestedUserId,
            });
          } catch (error) {
            console.error("Error fetching DB names and tag names:", error);
          }
        } catch (error) {
          console.log(`Picker: Error parsing URL '${currentPickedUrl}'`);
          return Promise.resolve({ error: `Failed parsing URL: '${currentPickedUrl}'` });
        }
      } else if (message.reference === "submitNewUser") {
        handleSubmitNewUserToDb(message.message);
      } else if (message.reference === "togglePicker") {
        console.log(`SB->B: `, message.reference);
        await sendMsgToContent("togglePicker", {});
      } else if (message.reference === "requestPickedItems") {
        console.log(`SB->B: `, message.reference);
        await sendMsgToContent("requestPickedItems", {});
      } else if (message.reference === "clearPickedItems") {
        console.log(`SB->B: `, message.reference);
        await sendMsgToContent("clearPickedItems", {});
      }
    });
  }
}

browser.runtime.onConnect.addListener(connected);



/* 
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
        get_reported_users_from_remote(
          dbOnlineQueryUrl, API_GET_RUSERS,
          message.message.userids, "stackoverflow.com"
        ).then(reportedUsers => {
          console.log(reportedUsers)
          sendMsgToContent("responseRecords", reportedUsers);
        })
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
 */