

const EXT_NAME = "chupmu"

const db_container = `<div class="db-container">
<div>
  <div>
    <p><label>DB name:</label></p>
    <textarea cols=50 rows=1 name="dbName"></textarea>
  </div>        
  <div>
    <p><label>DB url:</label></p>
    <textarea cols=50 rows=1 name="dbUrl"></textarea>
  </div>
  <div>
    <p><label>tooltipCss:</label></p>
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

function loadDbDataFromLocalStorage() {
  browser.storage.local.get(`${EXT_NAME}_config`).then(config => {
    if (config[`${EXT_NAME}_config`]["dbSources"] && config[`${EXT_NAME}_config`]["dbSources"].length > 0) {
      let dbSources = config[`${EXT_NAME}_config`]["dbSources"];
      let allDbContainers = document.getElementsByClassName("db-container");
      // If DB has more sources than DOM container:
      if (allDbContainers.length < dbSources.length) {
        for (let j = 0; j < dbSources.length - allDbContainers.length; j++) {
          handleAddTextareaButton();
        }
      }
      allDbContainers = document.getElementsByClassName("db-container");
      for (let i = 0; i < dbSources.length; i++) {
        allDbContainers[i].querySelector('textarea[name="dbName"]').value = dbSources[i]["dbName"];
        allDbContainers[i].querySelector('textarea[name="dbUrl"]').value = dbSources[i]["dbUrl"];
        allDbContainers[i].querySelector('textarea[name="dbCss"]').value = dbSources[i]["dbCss"];
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
    let dbs = document.getElementById("dbs");
    dbs.innerHTML += db_container;
    addRemoveEventHandlerForAllRemoveButtons();
    // DOM will reload after we update innerHtml. Need to reload the values from localstorage
    loadDbDataFromLocalStorage();
}

function handleSaveTextareaButton() {
  let dbSources = [];
  let allDbContainers = document.getElementsByClassName("db-container");
  for (let i = 0; i < allDbContainers.length; i++) {
    let dbName = allDbContainers[i].querySelector('textarea[name="dbName"]');
    let dbUrl = allDbContainers[i].querySelector('textarea[name="dbUrl"]');
    let dbCss = allDbContainers[i].querySelector('textarea[name="dbCss"]');
    dbSources.push({ "dbName": dbName.value, "dbCss": dbCss.value, "dbUrl": dbUrl.value });
  }
  // Store current db in local storage
  browser.storage.local.get(`${EXT_NAME}_config`).then(config => {
    config[`${EXT_NAME}_config`]["dbSources"] = dbSources;
    browser.storage.local.set(config);
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
