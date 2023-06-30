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
let gettingAllCommands = browser.commands.getAll();
gettingAllCommands.then((commands) => {
  for (let command of commands) {
    // Note that this logs to the Add-on Debugger's console: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Debugging
    // not the regular Web console.
    console.log(command);
  }
});


var urlRegex = /^https:\/\/voz\.vn\/t\//;

// A function to use as callback
function doStuffWithDom(domContent) {
    console.log('I received the following DOM content:\n' + domContent);
}
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
/**
 * Fired when a registered command is activated using a keyboard shortcut.
 *
 * In this sample extension, there is only one registered command: "Ctrl+Shift+U".
 * On Mac, this command will automatically be converted to "Command+Shift+U".
 */
browser.commands.onCommand.addListener((command) => {
  console.log("Keys pressed ...");
  // if (urlRegex.test(tab.url))
  browser.tabs
    .query({
      currentWindow: true,
      active: true,
    })
    .then(sendMessageToTabs)
    .catch(onError);
});
//   browser.tabs.sendMessage(tab.id, {text: 'report_back'}, doStuffWithDom);
//   // browser.tabs.create({ url: "https://developer.mozilla.org" });
// });
