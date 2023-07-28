const urlRegex = /^https:\/\/voz\.vn\/t\//;
// https://www.w3schools.com/css/css_tooltip.asp



const EXT_NAME = "chupmu"
const DB_NAME = 'chupmuDb';
const DB_VERSION = 1;
const DB_STORE_NAME = 'voz_test_db-12345';

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
      "dbName": "voz_test_db-12345",
      "description": "A test DB for Voz forum",
      "dbSource": "https://raw.githubusercontent.com/Que0Le/chupmu/main/__chupmu/test_db/voz_test_db.json",
      "onlineRecordUrlPrefix": "chupmu.org/voz_test_db-12345/userid=",
      "urls": [
        "https://voz.vn/t/noi-quy-cua-dien-dan-chi-tiet-tung-muc.1583/",
        "voz.vn/t/"
      ],
      "tags": {
        "0": {
          "tagId": "0",
          "description": "Xao lol",
          "tagname": "xao_lol"
        },
        "1": {
          "tagId": "1",
          "description": "Ga Con",
          "tagname": "ga_con"
        },
        "2": {
          "tagId": "2",
          "description": "Hieu Biet",
          "tagname": "hieu_biet"
        },
        "3": {
          "tagId": "3",
          "description": "Dot Con Hay Noi",
          "tagname": "dot_con_hay_noi"
        }
      },
      "dbCss": `.chupmu_css__voz_test_db-12345__xao_lol {
        background: pink !important;
      }
      .chupmu_css__voz_test_db-12345__ga_con {
        background: green !important;
      }
      .chupmu_css__voz_test_db-12345__hieu_biet {
        background: blue !important;
      }
      .chupmu_css__voz_test_db-12345__dot_con_hay_noi {
        background: red !important;
      }`
    }
  ],
  "action": {

  }
}

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


function sendMsgToTab(tab, reference, msg) {
  console.log(reference)
  browser.tabs.sendMessage(
    tab.id,
    {
      info: "chupmu_extension", reference: reference,
      source: "chupmu_background_script", target: "chupmu_content_script",
      message: msg
    })
    .then((response) => {
      console.log(`Answer C->B:`);
      console.log(response);
    })
    .catch(exception => console.log(exception));
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
  // TODO: hightlightCss from local storage for all DB 
  const hightlightCss = "";
  function toggle(title) {
    if (title === TITLE_APPLY) {
      // sendMsgToTab(tab, "toggleLabelify", "label");
      browser.pageAction.setIcon({ tabId: tab.id, path: "icons/on.svg" });
      browser.pageAction.setTitle({ tabId: tab.id, title: TITLE_REMOVE });
      browser.tabs.insertCSS({ code: TOOLTIP_CSS });
      // browser.tabs.insertCSS({ code: VOZ_CSS });
      portFromCS.postMessage(
        {
          info: "chupmu_extension", reference: "toggleLabelify",
          source: "chupmu_background_script", target: "chupmu_content_script",
          message: "label"
        });
    } else {
      // sendMsgToTab(tab, "toggleLabelify", "remove_label");
      browser.pageAction.setIcon({ tabId: tab.id, path: "icons/off.svg" });
      browser.pageAction.setTitle({ tabId: tab.id, title: TITLE_APPLY });
      browser.tabs.removeCSS({ code: TOOLTIP_CSS });
      // browser.tabs.removeCSS({ code: VOZ_CSS });
      portFromCS.postMessage(
        {
          info: "chupmu_extension", reference: "toggleLabelify",
          source: "chupmu_background_script", target: "chupmu_content_script",
          message: "removeLabel"
        });
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

/**
 * 
 * @param {Object} config config object from local storage
 * @returns dbUrls array of {"url1": "db1"}
 */
function reloadSupportedUrl(config) {
  let dbUrls = {};
  for (let i = 0; i < config.dbSources.length; i++) {
    let dbName = config.dbSources[i].dbName;
    // console.log(config.dbSources[i].urls)
    for (let j = 0; j < config.dbSources[i].urls.length; j++) {
      // console.log(dbUrls[config.dbSources[i].urls[j]])
      if (dbUrls[config.dbSources[i].urls[j]] && !dbUrls[config.dbSources[i].urls[j]].includes(dbName)) {
        dbUrls[config.dbSources[i].urls[j]].push(dbName);
      } else {
        dbUrls[config.dbSources[i].urls[j]] = [dbName];
      }
    }
  }
  let obj = {};
  obj[`${EXT_NAME}_dbUrls`] = dbUrls;
  browser.storage.local.set(obj);
  return dbUrls;
}


function handleRequestRecord(message) {
  return new Promise((resolve, reject) => {
    let results = [];
    browser.storage.local.get(`${EXT_NAME}_config`)
      .then(data => data[`${EXT_NAME}_config`])
      .then(config => {
        getFilterDbNamesForUrl(message.currentUrl)
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