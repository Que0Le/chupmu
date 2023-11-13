
// const db_container = `    
// <div class="db-container">
//   <div>
//     <p><label>DB source:</label></p>
//     <textarea cols=50 rows=1 name="dbName"></textarea>
//   </div>
// </div>`

function splitTrimFilterEmpty(string, delimiterChar) {
  return string.split(delimiterChar).map(substring => substring.trim()).filter(item => item !== '')
}

function sendMsgToBackground(reference, msg) {
  browser.runtime
    .sendMessage(
      null,
      {
        info: "chupmu_extension", reference: reference,
        source: "chupmu_option_script", target: "chupmu_background_script",
        message: msg
      })
    .then((response) => {
      console.log(`Answer B->O:`);
      console.log(response.response);
    })
    .catch(onError);
}

// function addDbEntry() {
//   let dbs = document.getElementById("dbs");
//   dbs.innerHTML += db_container;
//   addRemoveEventHandlerForAllRemoveButtons();
// }

// TODO: multi dbsources
function loadDbDataFromLocalStorage() {
  browser.storage.local.get(`${EXT_NAME}_config`).then(config => {
    if (config[`${EXT_NAME}_config`]["dbSources"] &&
      config[`${EXT_NAME}_config`]["dbSources"].length > 0) {
      let dbSources = config[`${EXT_NAME}_config`]["dbSources"];
      let dbContainer = document.getElementsByClassName("db-container")[0];
      dbContainer.querySelector('textarea[name="db-online-query-url"]').value =
        dbSources[0]["dbOnlineQueryUrl"] ? dbSources[0]["dbOnlineQueryUrl"] : "";
    }
  });
}

// TODO: multi dbsources
function handleSaveTextareaButton() {
  let dbSources = [];
  let dbContainer = document.getElementsByClassName("db-container")[0];
  let dbOnlineQueryUrls = splitTrimFilterEmpty(
    dbContainer.querySelector('textarea[name="db-online-query-url"]').value, ",");
  if (dbOnlineQueryUrls.length == 0) return;

  dbSources.push({ "dbOnlineQueryUrl": dbOnlineQueryUrls[0] });

  // Store current db in local storage
  browser.storage.local.get(`${EXT_NAME}_config`).then(config => {
    config[`${EXT_NAME}_config`]["dbSources"] = dbSources;
    browser.storage.local.set(config)
      .then(() => {
        // reload interface? update internal db?
      })
  });
}

loadDbDataFromLocalStorage();
document.getElementById("saveTextareas").addEventListener("click", handleSaveTextareaButton);
