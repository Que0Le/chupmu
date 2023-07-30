
function splitTrimFilterEmpty(string, delimiterChar) {
  return string.split.map(substring => substring.trim()).filter(item => item !== '')
}

function getConfigFromLocalStorage() {
  return new Promise((resolve, reject) => {
    const storageKey = `${EXT_NAME}_config`;

    browser.storage.local.get(storageKey)
      .then(data => {
        const config = data[storageKey];
        resolve(config);
      })
      .catch(error => {
        reject(error);
      });
  });
}

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
      // browser.tabs.insertCSS({ code: TOOLTIP_CSS });
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
      // browser.tabs.removeCSS({ code: TOOLTIP_CSS });
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
 * Generate a list of url and database name that supports the url.
 * Store the data in local storage of the extension
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
              return getRawRecordsFromFilterDb(supportedDb, message.ids)
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


function addNewTagToTagsObject(tagsObject, tagNames) {
  let maxTagId = -1;
  let toAddTagNames = JSON.parse(JSON.stringify(tagNames));
  let oldAndNewTagIds = [];
  // Get highest id and also filter out existing tag names
  for (const [key, value] of Object.entries(tagsObject)) {
    const numericTagId = parseInt(tagsObject[key].tagId, 10);
    if (!isNaN(numericTagId) && numericTagId > maxTagId) {
      maxTagId = numericTagId;
    }
    if (tagNames.includes(value.tagname)) {
      oldAndNewTagIds.push(key);
      toAddTagNames = toAddTagNames.filter(str => str !== value.tagname);
      continue;
    }
  }
  // Now, add new tag names
  let newTagsObject = JSON.parse(JSON.stringify(tagsObject));
  toAddTagNames.forEach(newTag => {
    const newTagId = (maxTagId += 1).toString();
    newTagsObject[newTagId] = { tagId: newTagId, description: "", tagname: newTag };
    oldAndNewTagIds.push(newTagId);
  });
  return { newTagsObject, oldAndNewTagIds };
}

function handleSubmitNewUserToDb(data) {
  // let msg = {
  //   "reference": "submitNewUser",
  //   "data": {
  //     "platformUrls": platformUrls,
  //     "userId": userId,
  //     "note": note,
  //     "targetDbNamesAndTheirTagNames": dbAndTags
  //   }
  // }
  console.log(data);
  getAllFilterDbNamesAndTheirTags()
    .then(dbNamesAndTheirTags => {
      return getConfigFromLocalStorage().then(config => { 
        return { dbNamesAndTheirTags, config }; 
      })
    })
    .then(({dbNamesAndTheirTags, config}) => {
      for (const targetDbNameAndTagNames of data.targetDbNamesAndTheirTagNames) {
        if (dbNamesAndTheirTags[targetDbNameAndTagNames.dbName]) {
          // add new tags to temp settings
          const { newTagsObject, oldAndNewTagIds } = addNewTagToTagsObject(
            dbNamesAndTheirTags[targetDbNameAndTagNames.dbName], targetDbNameAndTagNames.tagNames
          );
          // TODO: add to existing db
          console.log(newTagsObject, {
            "userid": data.userId,
            "note": data.note,
            "tagIds": oldAndNewTagIds
          })
          // TODO: save to settings
        } else {
          // Create new db
        }
      }

    })
}