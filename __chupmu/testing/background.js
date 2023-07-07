const urlRegex = /^https:\/\/voz\.vn\/t\//;
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
let tags = ["xao_lol", "ga_con", "hieu_biet", "dot_con_hay_noi"]
let VOZ_CSS = `
.chupmu_css_${tags[0]} {
  background: pink !important;
}

.chupmu_css_${tags[1]} {
  background: green !important;
}

.chupmu_css_${tags[2]} {
  background: blue !important;
}

.chupmu_css_${tags[3]} {
  background: red !important;
}
`;

// TODO: move this to local storage, and make it possible to be edited by user
let action_db = {
  "xao_lol": { "background": "pink" },
  "pro": { "background": "green" },
  "ga_con": { "background": "blue" },
  "dot_con_hay_noi": { "background": "red" },
};

// TODO: if not found in local storage, set to TOOLTIP_CSS as default
browser.storage.local.set({ "__TOOLTIP_CSS": { "css": TOOLTIP_CSS } });

function sendMsgToTab(tab, reference, msg) {
  browser.tabs
    .sendMessage(
      tab.id,
      {
        info: "chupmu_extension", reference: reference,
        source: "chupmu_background_script", target: "chupmu_content_script",
        message: msg
      })
    .then((response) => {
      console.log(`Answer C->B:`);
      console.log(response.response);
    })
    .catch(onError);
}


/*  Init  page action */
const TITLE_APPLY = "Apply CSS";
const TITLE_REMOVE = "Remove CSS";
const APPLICABLE_PROTOCOLS = ["http:", "https:"];
/*
Toggle CSS: based on the current title, insert or remove the CSS.
Update the page action's title and icon to reflect its state.
*/
function toggleLabelify(tab) {
  function toggle(title) {
    if (title === TITLE_APPLY) {
      sendMsgToTab(tab, "toggleLabelify", "label");
      browser.pageAction.setIcon({ tabId: tab.id, path: "icons/on.svg" });
      browser.pageAction.setTitle({ tabId: tab.id, title: TITLE_REMOVE });
      browser.tabs.insertCSS({ code: TOOLTIP_CSS });
      browser.tabs.insertCSS({ code: VOZ_CSS });
    } else {
      sendMsgToTab(tab, "toggleLabelify", "remove_label");
      browser.pageAction.setIcon({ tabId: tab.id, path: "icons/off.svg" });
      browser.pageAction.setTitle({ tabId: tab.id, title: TITLE_APPLY });
      browser.tabs.removeCSS({ code: TOOLTIP_CSS });
      browser.tabs.removeCSS({ code: VOZ_CSS });
    }
  }

  // TODO: comfirm msg from content script
  let gettingTitle = browser.pageAction.getTitle({ tabId: tab.id });
  gettingTitle.then(title => {
    toggle(title);
  });
}

/*
Initialize the page action: set icon and title, then show.
Only operates on tabs whose URL's protocol is applicable.
*/
function initializePageAction(tab) {
  if (urlRegex.test(tab.url)) {
    browser.pageAction.setIcon({ tabId: tab.id, path: "icons/off.svg" });
    browser.pageAction.setTitle({ tabId: tab.id, title: TITLE_APPLY });
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


function onError(error) {
  console.error(`Error: ${error}`);
}





/* IndexedDB */
const DB_NAME = 'chupmuDb';
const DB_VERSION = 1;
const DB_STORE_NAME = 'voz1';

// Open the IndexedDB
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = function (event) {
      reject("Error opening database");
    };

    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      const objectStore = db.createObjectStore(DB_STORE_NAME, { keyPath: 'userid', autoIncrement: false });
      objectStore.createIndex('userid', 'userid', { unique: true });
      objectStore.createIndex('record', 'record', { unique: false });
    };

    request.onsuccess = function (event) {
      const db = event.target.result;
      resolve(db);
    };
  });
}

// Write data to the IndexedDB
function writeData() {
  openDb()
    .then(db => {
      const transaction = db.transaction(DB_STORE_NAME, 'readwrite');
      const objectStore = transaction.objectStore(DB_STORE_NAME);

      const data = [
        { name: 'John', age: 25, userid: 0 },
        { name: 'Jane', age: 30, userid: 3 },
        { name: 'Bob', age: 35, userid: 4 }
      ];

      data.forEach(item => {
        const request = objectStore.add(item);
        request.onerror = function (event) {
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
}

// Read data from the IndexedDB
function readData() {
  openDb()
    .then(db => {
      const transaction = db.transaction(DB_STORE_NAME, 'readonly');
      const objectStore = transaction.objectStore(DB_STORE_NAME);

      const request = objectStore.getAll();
      request.onerror = function (event) {
        console.error('Error reading data', event.target.error);
      };
      request.onsuccess = function (event) {
        const data = event.target.result;
        console.log('Data read successfully:', data);
        db.close();
      };
    })
    .catch(error => {
      console.error('Error opening database:', error);
    });
}

// Call the writeData function to write data to the IndexedDB
// writeData();

// Call the readData function to read data from the IndexedDB
// readData();

const DEFAULT_SETTINGS = {
  "tooltipCss": `.tooltip {
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
  }`,
  "dbSources": [
    {
      "dbName": "voz1",
      "css": `.chupmu_css_voz1_xao_lol} {
        background: pink !important;
      }
      .chupmu_css__voz1_ga_con} {
        background: green !important;
      }
      .chupmu_css__voz1_hieu_biet} {
        background: blue !important;
      }
      .chupmu_css__voz1_dot_con_hay_noi} {
        background: red !important;
      }`,
      "url": "https://raw.githubusercontent.com/Que0Le/chupmu/main/__chupmu/test_db/voz_test_db.json"
    }
  ],
  "action": {

  }
}

/* Read Setting */
const EXT_NAME = "chupmu"
browser.storage.local.get(`${EXT_NAME}_config`).then(config => {
  if (Object.keys(r).length == 0) {
    console.log("No config found. Set to default ...");

  }
  Object.keys(r).length > 0 ? console.log(r) : console.log("non")
});


fetch("https://raw.githubusercontent.com/Que0Le/chupmu/main/__chupmu/test_db/voz_test_db.json")
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
    // browser.storage.local.set(data["db"]);
    openDb()
      .then(db => {
        const transaction = db.transaction(DB_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(DB_STORE_NAME);
        Object.entries(data["db"]).forEach(([key, value]) => {
          const request = objectStore.add(value);
          request.onerror = function (event) {
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
  // console.log("Keys pressed ...");
  // const gettingCurrent = browser.tabs.getCurrent();
  // gettingCurrent.then(tab => {toggleCSS(tab)}, onError);
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

function handleGetRecords(msg) {
  return new Promise((resolve, reject) => {
    console.log(`getting records for id: ${msg["ids"]}`);
    openDb()
      .then(db => {
        const transaction = db.transaction(DB_STORE_NAME, 'readonly');
        const objectStore = transaction.objectStore(DB_STORE_NAME);

        let result = {};
        const getPromises = msg["ids"].map(id => {
          return new Promise((resolve, reject) => {
            const request = objectStore.get(id);
            request.onerror = function (event) {
              console.error('Error reading data', event.target.error);
              reject(event.target.error);
            };
            request.onsuccess = function (event) {
              const data = event.target.result;
              if (data) {
                console.log('Data read successfully:', data);
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

browser.runtime.onMessage.addListener((request) => {
  if (
    request["info"] != "chupmu_extension" ||
    request["source"] != "chupmu_content_script" ||
    request["target"] != "chupmu_background_script"
  ) {
    return;
  }
  if (request["reference"] == "get_records") {
    console.log(`Request C->B: get_records ...`);
    return handleGetRecords(request["message"])
      .then(result => {
        console.log(result);
        return { response: result };
      })
      .catch(error => {
        console.error('Error retrieving records:', error);
        return { error: "Error getting records" };
      });
  }
  // TODO: send msg back to background script to store state
  // return Promise.resolve({ response: `Chupmu Content script: Done for command '${request["message"]}'` });
});