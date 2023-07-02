const urlRegex = /^https:\/\/voz\.vn\/t\//;


/*  Init  page action */
const TITLE_APPLY = "Apply CSS";
const TITLE_REMOVE = "Remove CSS";
const APPLICABLE_PROTOCOLS = ["http:", "https:"];
/*
Toggle CSS: based on the current title, insert or remove the CSS.
Update the page action's title and icon to reflect its state.
*/
function toggleCSS(tab) {

  function gotTitle(title) {
    if (title === TITLE_APPLY) {
      browser.pageAction.setIcon({tabId: tab.id, path: "icons/on.svg"});
      browser.pageAction.setTitle({tabId: tab.id, title: TITLE_REMOVE});
      browser.tabs.insertCSS({code: CSS});
    } else {
      browser.pageAction.setIcon({tabId: tab.id, path: "icons/off.svg"});
      browser.pageAction.setTitle({tabId: tab.id, title: TITLE_APPLY});
      browser.tabs.removeCSS({code: CSS});
    }
  }

  let gettingTitle = browser.pageAction.getTitle({tabId: tab.id});
  gettingTitle.then(gotTitle);
}
/*
Returns true only if the URL's protocol is in APPLICABLE_PROTOCOLS.
Argument url must be a valid URL string.
*/
function protocolIsApplicable(url) {
  const protocol = (new URL(url)).protocol;
  return APPLICABLE_PROTOCOLS.includes(protocol);
}

/*
Initialize the page action: set icon and title, then show.
Only operates on tabs whose URL's protocol is applicable.
*/
function initializePageAction(tab) {
  if (protocolIsApplicable(tab.url) && urlRegex.test(tab.url)) {
    browser.pageAction.setIcon({tabId: tab.id, path: "icons/off.svg"});
    browser.pageAction.setTitle({tabId: tab.id, title: TITLE_APPLY});
    browser.pageAction.show(tab.id);
  }
}

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
/*
Toggle CSS when the page action is clicked.
*/
// browser.pageAction.onClicked.addListener(toggleCSS);

// https://www.w3schools.com/css/css_tooltip.asp
let TOOLTIP_CSS = `
.tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: black;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 0;

  /* Position the tooltip */
  position: absolute;
  z-index: 1;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
}
`

browser.storage.local.set({"__TOOLTIP_CSS": {"css": TOOLTIP_CSS}});


function onError(error) {
  console.error(`Error: ${error}`);
}

function sendMessageToTabs(tabs) {
  for (const tab of tabs) {
    browser.tabs
      .sendMessage(tab.id, { greeting: "Hi from background script" })
      .then((response) => {
        console.log("Message from the content script:");
        console.log(response.response);
      })
      .catch(onError);
  }
}

fetch("https://raw.githubusercontent.com/Que0Le/chupmu/main/__chupmu/voz_id_db.json")
    .then((response) => response.json())
    .then((data) => {
        console.log(data);
        browser.storage.local.set(data);
    });

/**
 * Fired when a registered command is activated using a keyboard shortcut.
 *
 * In this sample extension, there is only one registered command: "Ctrl+Shift+U".
 * On Mac, this command will automatically be converted to "Command+Shift+U".
 */
browser.commands.onCommand.addListener((command) => {
  console.log("Keys pressed ...");
  // toggleCSS();
  console.log("toggled css");
  // if (urlRegex.test(tab.url))]

  // See apply-css/background.js for how to add/remove css
  const gettingCssStorage = browser.storage.local.get("__TOOLTIP_CSS");
  gettingCssStorage.then(css => {
    console.log(css);
    let insertingCSS = browser.tabs.insertCSS({code: css["__TOOLTIP_CSS"]["css"]});
    insertingCSS.then(null, onError);
  }, onError);
  // let insertingCSS = browser.tabs.insertCSS({code: TOOLTIP_CSS});
  // insertingCSS.then(null, onError);

  browser.tabs.query({currentWindow: true, active: true})
    .then(sendMessageToTabs)
    .catch(onError);
});





/**
 * Returns all of the registered extension commands for this extension
 * and their shortcut (if active).
 *
 * Since there is only one registered command in this sample extension,
 * the returned `commandsArray` will look like the following:
 *    [{
 *       name: "toggle-feature",
 *       description: "Send a 'toggle-feature' event to the extension"
 *       shortcut: "Ctrl+Shift+U"
 *    }]
 */
// let gettingAllCommands = browser.commands.getAll();
// gettingAllCommands.then((commands) => {
//   for (let command of commands) {
//     // Note that this logs to the Add-on Debugger's console: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Debugging
//     // not the regular Web console.
//     console.log(command);
//   }
// });
