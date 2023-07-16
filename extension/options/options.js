

// const EXT_NAME = "chupmu"

const db_container = `<div class="db-container">
<div>
  <div>
    <p><label>DB name:</label></p>
    <textarea cols=50 rows=1 name="dbName"></textarea>
  </div>    
  <div>
    <p><label>DB description:</label></p>
    <textarea cols=50 rows=1 name="dbDescription"></textarea>
  </div>       
  <div>
    <p><label>Supported URLs (platform urls), splitted by comma:</label></p>
    <textarea cols=50 rows=1 name="urls"></textarea>
  </div>    
  <div>
    <p><label>DB source url (direct link to download the DB):</label></p>
    <textarea cols=50 rows=1 name="dbUrl"></textarea>
  </div>
  <div>
    <p><label>Highlight CSS:</label></p>
    <textarea cols=50 rows=5 name="dbCss"></textarea>
  </div>
</div>
<button class="removeButton">Remove Textarea</button>
</div>`

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

function addDbEntry() {
  let dbs = document.getElementById("dbs");
  dbs.innerHTML += db_container;
  addRemoveEventHandlerForAllRemoveButtons();
}

function loadDbDataFromLocalStorage() {
  browser.storage.local.get(`${EXT_NAME}_config`).then(config => {
    if (config[`${EXT_NAME}_config`]["dbSources"] && config[`${EXT_NAME}_config`]["dbSources"].length > 0) {
      let dbSources = config[`${EXT_NAME}_config`]["dbSources"];
      // console.log(dbSources)
      let allDbContainers = document.getElementsByClassName("db-container");
      // If DB has more sources than DOM container:
      if (allDbContainers.length < dbSources.length) {
        while (allDbContainers.length < dbSources.length) {
          addDbEntry();
        }
        // for (let j = 0; j < dbSources.length - allDbContainers.length; j++) {
        //   addDbEntry();
        //   console.log(allDbContainers.length, dbSources.length)
        // }
        // loadDbDataFromLocalStorage();
      }
      console.log(allDbContainers)
      allDbContainers = document.getElementsByClassName("db-container");
      for (let i = 0; i < dbSources.length; i++) {
        allDbContainers[i].querySelector('textarea[name="dbName"]').value =
          dbSources[i]["dbName"] ? dbSources[i]["dbName"] : "";
        allDbContainers[i].querySelector('textarea[name="dbDescription"]').value =
          dbSources[i]["description"] ? dbSources[i]["description"] : "";
        allDbContainers[i].querySelector('textarea[name="urls"]').value =
          dbSources[i]["urls"] ? dbSources[i]["urls"].join(",\n") : "";
        allDbContainers[i].querySelector('textarea[name="dbUrl"]').value =
          dbSources[i]["dbUrl"] ? dbSources[i]["dbUrl"] : "";
        allDbContainers[i].querySelector('textarea[name="dbCss"]').value =
          dbSources[i]["dbCss"] ? dbSources[i]["dbCss"] : "";
      }
    }
  });
}

// TODO: add more fields: apply url (voz, voz_tan, ...)
function handleRemoveButton(event) {
    let dbContainer = event.target.parentNode;
    dbContainer.parentNode.removeChild(dbContainer);
}

function handleAddTextareaButton(event) {
    // let dbs = document.getElementById("dbs");
    // dbs.innerHTML += db_container;
    // addRemoveEventHandlerForAllRemoveButtons();
    addDbEntry();
    // DOM will reload after we update innerHtml. Need to reload the values from localstorage
    loadDbDataFromLocalStorage();
}

function handleSaveTextareaButton() {
  let dbSources = [];
  let allDbContainers = document.getElementsByClassName("db-container");
  for (let i = 0; i < allDbContainers.length; i++) {
    let dbName = allDbContainers[i].querySelector('textarea[name="dbName"]').value;
    let dbDescription = allDbContainers[i].querySelector('textarea[name="dbDescription"]').value;
    let urls = allDbContainers[i].querySelector('textarea[name="urls"]').value;
    let dbUrl = allDbContainers[i].querySelector('textarea[name="dbUrl"]').value;
    let dbCss = allDbContainers[i].querySelector('textarea[name="dbCss"]').value;
    dbSources.push({ 
      "dbName": dbName, "dbDescription": dbDescription, 
      "urls": urls.split(",").map(url => url.trim()),
      "dbCss": dbCss, "dbUrl": dbUrl 
    });
  }
  // Store current db in local storage
  browser.storage.local.get(`${EXT_NAME}_config`).then(config => {
    config[`${EXT_NAME}_config`]["dbSources"] = dbSources;
    browser.storage.local.set(config)
    .then(() => {
      // Generate matching URL set
      browser.storage.local.get(`${EXT_NAME}_config`).then(data => {
        // console.log(data)
        let config = data[`${EXT_NAME}_config`];
        reloadSupportedUrl(config);
      });
    })
  });


}

function addRemoveEventHandlerForAllRemoveButtons() {
  let allRemoveButtons = document.getElementsByClassName("removeButton");
  for (let i = 0; i < allRemoveButtons.length; i++) {
    allRemoveButtons[i].addEventListener("click", handleRemoveButton);
  }
}

loadDbDataFromLocalStorage();
document.getElementById("addTextarea").addEventListener("click", handleAddTextareaButton);
document.getElementById("saveTextareas").addEventListener("click", handleSaveTextareaButton);
addRemoveEventHandlerForAllRemoveButtons();
