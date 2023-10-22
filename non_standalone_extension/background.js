"use strict";

let dbOnlineQueryUrl = "";
let dbOnlineUserFilesQueryUrl = "";
let isPickingScreenshot = false;

/* Set default Setting */
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
async function initializePageActionOnUpdated(tabId, changeInfo, tab) {
  await initializePageAction(tab);
}

/*
When first loaded, initialize the page action (icon on the url bar) for all tabs.
*/
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
  dbOnlineUserFilesQueryUrl = data.chupmu_config.dbSources[0].dbOnlineUserFilesQueryUrl;
  console.log(`dbOnlineQueryUrl: ${dbOnlineQueryUrl} | dbOnlineUserFilesQueryUrl: ${dbOnlineUserFilesQueryUrl}`);
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

let currentPickedUrl = "";
let suggestedUserId = "";
let suggestedPlatformUrl = "";
let suggestedTags = [];

(async () => {
  try {
    await createContextMenus();
    // Events
    browser.contextMenus.onClicked.addListener(async (info, tab) => {
      if (info.menuItemId === "chupmu_pick_this_user") {
        currentPickedUrl = info.linkUrl;
        isPickingScreenshot = true;
        await browser.sidebarAction.open();
        // Wait for sidebar to open and establish the com
        // await new Promise(resolve => setTimeout(resolve, 500));
        await sendMsgToSidebar("forceReloadSidebar", {});
        await updateVisibilityMenuItem("chupmu_pick_this_element", true);
      }
    });
  } catch (error) {
    console.error("Error creating context menu items:", error);
  }
})();

async function handleLabelifySignal() {
  const [currentUrl, supportedUrl, contentScriptPath] = await
    isUrlSupported(await getCurrentTabUrl());
  if (!supportedUrl) return;

  const [tab] = await browser.tabs.query({
    active: true, windowId: browser.windows.WINDOW_ID_CURRENT
  });

  await toggleLabelify(tab, currentUrl, contentScriptPath);
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
          await sendMsgToContent("responseRecords", {
            reportedUsers: reportedUsers,
            dbOnlineUserFilesQueryUrl: dbOnlineUserFilesQueryUrl
          });
        } catch (error) {
          console.error("Error fetching reported users:", error);
        }
      } else if (message.reference === "responsePickedItems") {
        async function captureAndPush(rect, screenshotNote) {
          const imageDetails = { format: "png", quality: 100, rect: rect, scale: 1.0 };

          try {
            const dataUrl = await browser.tabs.captureVisibleTab(imageDetails);
            return {
              dataUrl: dataUrl,   // this is the png data
              screenshotNote: screenshotNote,
            };
          } catch (error) {
            console.error("Error capturing visible tab:", error);
            return null;
          }
        }

        try {
          // const tabs = await browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT });
          // const url = tabs[0].url;
          const capturePromises = message.message.imgDescs.map(
            (imgDesc) => captureAndPush(imgDesc.rect, imgDesc.screenshotNote)
          );

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
      } else if (message.reference === "responseExtractUserIdFromUrl") {
        console.log(`Request C->B: ${message.reference}`, message.message);
        suggestedUserId = message.message.userid;
        // Get some user data
        const reportedUsers = await get_reported_users_from_remote(
          dbOnlineQueryUrl, API_GET_RUSERS,
          [suggestedUserId], suggestedPlatformUrl
        );
        // console.log(reportedUsers)
        if (reportedUsers.length > 0) { // TODO: handle multiple results
          suggestedTags = reportedUsers[0].tags
        }
        const tabs = await browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT });
        await sendMsgToSidebar("responseGetCurrentPickedUrl", {
          urlRecorded: tabs[0].url,
          currentPickedUrl: currentPickedUrl,
          suggestedTags: suggestedTags,
          suggestedPlatformUrl: suggestedPlatformUrl,
          suggestedUserId: suggestedUserId,
        });

      }
    });
  } else if (p && p.name === "port-sidebar") {
    portChannelSidebar = p;
    console.log("Connected with sidebar");
    portChannelSidebar.onMessage.addListener(async (message, sender) => {
      if (message.source !== "chupmu_sidebar_script") {
        console.log("Warning B: portChannelSidebar received message from unknown source: ", message);
        return;
      }
      if (message.reference === "getCurrentPickedUrl") {
        console.log(`SB->B: `, message.reference);
        if (currentPickedUrl === "") return;
        // Check if we support this url
        const [currentUrl, supportedUrl, contentScriptPath] = await
          isUrlSupported(await getCurrentTabUrl());
        if (supportedUrl) {
          // Load CS script ...
          suggestedPlatformUrl = supportedUrl;
          const [tab] = await browser.tabs.query({
            active: true, windowId: browser.windows.WINDOW_ID_CURRENT
          });
          await loadContentScriptIfHadnot(tab.id, currentUrl, contentScriptPath);
          // ... and ask CS to extract the userid from URL.
          // See "responseExtractUserIdFromUrl"
          await sendMsgToContent("requestExtractUserIdFromUrl", {
            "currentPickedUrl": currentPickedUrl
          });
        } else {
          console.log("Not supported url. Sending raw data to sidebar");
          await sendMsgToSidebar("responseGetCurrentPickedUrl", {
            currentPickedUrl: currentPickedUrl,
            suggestedTags: suggestedTags,
            suggestedPlatformUrl: suggestedPlatformUrl,
            suggestedUserId: suggestedUserId,
          });
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
