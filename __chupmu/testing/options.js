

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


// TODO: add more fields: apply url (voz, voz_tan, ...)
function handleRemoveButton(event) {
    let dbContainer = event.target.parentNode;
    dbContainer.parentNode.removeChild(dbContainer);
}

function handleAddTextareaButton(event) {
    let dbs = document.getElementById("dbs");
    dbs.innerHTML += db_container;
    addRemoveEventHandlerForAllRemoveButtons();
}

function handleSaveTextareaButton() {
  let dbSources = [];
  let allDbContainers = document.getElementsByClassName("db-container");
  for (let i = 0; i < allDbContainers.length; i++) {
    let dbName = allDbContainers[i].querySelector('textarea[name="dbName"]');
    let dbUrl = allDbContainers[i].querySelector('textarea[name="dbUrl"]');
    let dbCss = allDbContainers[i].querySelector('textarea[name="dbCss"]');
    dbSources.push({ "dbName": dbName.value, "css": dbCss.value, "dbUrl": dbUrl.value });
  }
  // Store current db in local storage
  browser.storage.local.get(`${EXT_NAME}_config`).then(config => {
    console.log(config);
    config["dbSources"] = dbSources;
    // Object.keys(r).length > 0 ? console.log(r) : console.log("non")
  });

}

function addRemoveEventHandlerForAllRemoveButtons() {
  let allRemoveButtons = document.getElementsByClassName("removeButton");
  for (let i = 0; i < allRemoveButtons.length; i++) {
    allRemoveButtons[i].addEventListener("click", handleRemoveButton);
  }
}

document.getElementById("addTextarea").addEventListener("click", handleAddTextareaButton);
document.getElementById("saveTextareas").addEventListener("click", handleSaveTextareaButton);
addRemoveEventHandlerForAllRemoveButtons();

// browser.runtime.sendMessage({ greeting: "Hello from options script" }, response => {
//   // Handle the response received from the background script
//   console.log("Response from background script:", response);
// });