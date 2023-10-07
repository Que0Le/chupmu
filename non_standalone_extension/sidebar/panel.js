const newDbContainerCode = "__newDb";
const newDbNameInputId = "new-db-name-input";
const newTagInputId = "new-tag-input";
let portSidebar;
let currentPickedData = [];
let currentPickedUnixTime = 0;
// let currentPickedUrl = "";
// let currentPickedUser = "";

function resetPickedData() {
  currentPickedData = [];
  currentPickedUnixTime = 0;
  // currentPickedUrl = "";
  // currentPickedUser = "";
}

let currentScreenshotDataId = 0; 

/**
 * 
 * @param {String} reference 
 * @param {Object} message 
 */
function sendMsgToBackground(reference, message) {
  portSidebar.postMessage({
    info: "chupmu_extension", reference: reference,
    source: "chupmu_sidebar_script", target: "chupmu_background_script",
    message: message
  });
}

function splitTrimFilterEmpty(string, delimiterChar) {
  return string.split(delimiterChar).map(substring => substring.trim()).filter(item => item !== '')
}

const DEFAULT_INPUT_AREA = `<div class="container-1">
  <p><label>Raw URL:</label></p>
  <textarea rows=3 id="raw-url"></textarea>
</div>
<div class="container-1">
  <p><label>Platform URL (multiple urls separated with comma):</label></p>
  <textarea rows=1 id="platform-url"></textarea>
</div>
<div class="container-1">
  <p><label>User ID:</label></p>
  <input type="text" id="user-id"></input>
</div>
<div class="container-1">
  <div>
    <p><label>Note:</label></p>
    <textarea rows=5 id="note"></textarea>
  </div>
</div>
<div id="db-area">
  <p><label>Database section:</label></p>
</div>

<div>
  <button id="submit">Submit</button>
</div>
<div>
  <button id="toggle-picker-button">Toogle Picker</button>
</div>
<div>
  <button id="include-picked-button">Include picked items</button>
</div>
<div>
  <button id="clear-picked-button">Clear picked items</button>
</div>`;


function generateHtmlScreenshotContainer(url, timestamp, dataUrl, screenshotId) {
  let innerHtml = `
  <div class="screenshot-container">
    <div class="screenshot-url">${url}</div>
    <div class="screenshot-timestamp">${timestamp}</div>
    <img src="${dataUrl}">
    <input placeholder="Description" screenshot-id="${screenshotId}">
  </div>`;
  return innerHtml;
}


function generateInnerHtmlDbContainer(dbName, tagNames) {
  let innerHtml = `<div class="db-container">
    <div class="db-entry">
      <label>DB name:</label>
      <label><input type="checkbox" value="${dbName}" isdbname>${dbName}</label>
    </div>
    <div class="tag-entry">`;
  if (tagNames && tagNames.length > 0) {
    innerHtml += `<p><label>Tag names:</label></p>`
  }
  for (const tagName of tagNames) {
    innerHtml += `<label><input type="checkbox" value="${tagName}" dbname="${dbName}">${tagName}</label>`
  }
  innerHtml += `</div>
    <p><label>New tags (split with comma):</label></p>
    <input type="text" dbname="${dbName}">
  </div>`
  return innerHtml;
}

function generateContainerForNewDb() {
  let innerHtml = `<div class="db-container">
    <div class="db-entry">
    <p><label>New DB name:</label></p>
    <input type="text" id="${newDbNameInputId}">
    </div>
    <div class="tag-entry">`;
  innerHtml += `</div>
    <p><label>New tags (split with comma):</label></p>
    <input type="text" id="${newTagInputId}">
  </div>`
  return innerHtml;
}

function addDomOnStartUp(msg) {
  document.getElementById("input-area").innerHTML = DEFAULT_INPUT_AREA;
  document.getElementById("raw-url").value = msg.currentPickedUrl;
  document.getElementById("platform-url").value = msg.suggestedPlatformUrl;
  document.getElementById("user-id").value = msg.suggestedUserId;
  let dbArea = document.getElementById("db-area");
  for (const [key, value] of Object.entries(msg.dbNamesAndTheirTagNames)) {
    dbArea.innerHTML += generateInnerHtmlDbContainer(key, value)
  }
  dbArea.innerHTML += generateContainerForNewDb("__newDb");

  // currentPickedUser = msg.suggestedUserId;
}


function getDbTagData() {
  let checkedDbs = document.querySelectorAll("input[type='checkbox'][isdbname]:checked");
  let dbAndTags = [];
  // Existing DBs
  for (const cd of checkedDbs) {
    let dbName = cd.value;
    let tagNames = [];
    let tagInputs = document.querySelectorAll(`input[type='checkbox'][dbname='${dbName}']:checked`);
    for (const ti of tagInputs) {
      tagNames.push(ti.value)
    }
    let newTagNames = document.querySelector(`input[type='text'][dbname='${dbName}']`)
      .value.split(",")
      .map(substring => substring.trim()).filter(item => item !== '')
    tagNames.push(...newTagNames)
    tagNames = [...new Set(tagNames)]
    dbAndTags.push({ "dbName": dbName, "tagNames": tagNames });
  }
  // New DB
  let newDbName = document.getElementById(newDbNameInputId).value.trim();
  let newTagNames = document.getElementById(newTagInputId).value.split(",")
    .map(substring => substring.trim()).filter(item => item !== '');
  if (newDbName.length > 0) {
    dbAndTags.push({ "dbName": newDbName, "tagNames": newTagNames });
  }
  return dbAndTags;
}

function runAsStandAloneHtml() {
  let pickerActive = false;
  let pickedElements = [];
  let currentPickingElement;
  let encounterHovers = 0;
  const msg = {
    "currentPickedUrl": "https://voz.vn/u/baby-diehard.71866/",
    "suggestedPlatformUrl": "voz.vn",
    "suggestedUserId": "baby-diehard.71866",
    "dbNamesAndTheirTagNames": {
      "_db1": ["_tag11", "_tag12"],
      "_db2": ["_tag22", "_tag23"],
    }
  }
  addDomOnStartUp(msg);

  function handleSubmit() {
    let platformUrls = splitTrimFilterEmpty(document.getElementById("platform-url").value, ",");
    let userId = document.getElementById("user-id").value;
    let note = document.getElementById("note").value;
    let dbNamesAndTheirTagNames = getDbTagData();
    console.log({
      "platformUrls": platformUrls,
      "userId": userId,
      "note": note,
      "targetDbNamesAndTheirTagNames": dbNamesAndTheirTagNames
    })
  }

  document.getElementById("submit").addEventListener("click", handleSubmit);


  function togglePicker() {
    pickerActive = !pickerActive;
    if (pickerActive) {
      // Add event listener to highlight elements on mouseover
      document.addEventListener('mouseover', handleElementMouseOver);
      // Add event listener to capture element click
      document.addEventListener('click', handleElementClick);
    } else {
      // Remove event listeners
      document.removeEventListener('mouseover', handleElementMouseOver);
      document.removeEventListener('click', handleElementClick);
      // Remove any highlighting
      removeHighlight();
    }
  }

  function handleElementMouseOver(event) {
    if (!pickerActive) {
      return;
    }

    if (currentPickingElement !== event.target) {
      if (currentPickingElement && !pickedElements.includes(currentPickingElement)) {
        currentPickingElement.style.outline = '';
      }
      currentPickingElement = event.target;
      if (!pickedElements.includes(currentPickingElement)) {
        currentPickingElement.style.outline = '2px solid red';
      }
    }
    encounterHovers += 1;
  }


  function handleElementClick(event) {
    if (pickerActive) {
      if (pickedElements.includes(event.target)) {
        // Remove from list
        event.target.style.outline = '';
        pickedElements.splice(pickedElements.indexOf(event.target), 1);
      } else {
        // Mark the element green
        event.target.style.outline = '2px solid green';
        pickedElements.push(event.target);
      }
    }
  }

  function removeHighlight() {
    let i = 0;
    let highlightedElement = document.querySelector('[style="outline: 2px solid red;"]');
    while (i < encounterHovers * 2 && highlightedElement) {
      highlightedElement.style.outline = '';
      i++;
      highlightedElement = document.querySelector('[style="outline: 2px solid red;"]');
    }
  }

  document.getElementById("toggle-picker-button").addEventListener("click", togglePicker);

  function handleIncludePickedItems() {
    // Doesn't support screenshot with standalone HTML!
  }
  document.getElementById("include-picked-button").addEventListener("click", handleIncludePickedItems);
}

function handleTEMP1(data) {
  document.getElementById("sidebar-status").textContent = "Picking:";
  addDomOnStartUp(data);

  function handleSubmit() {
    /* Gather data */
    let platformUrls = splitTrimFilterEmpty(document.getElementById("platform-url").value, ",");
    let userId = document.getElementById("user-id").value;
    let note = document.getElementById("note").value;
    let dbNamesAndTheirTagNames = getDbTagData();
    // Get shot's description
    const noteInputs = document.querySelectorAll('input[screenshot-id]');
    for (let i = 0; i < noteInputs.length; ++i) {
      for (let j = 0; j < currentPickedData.length; j++) {
        if (noteInputs[i].getAttribute('screenshot-id') === String(currentPickedData[j].screenshotId)) {
          currentPickedData[j].description = noteInputs[i].value.trim();
          break;
        }
      }
    }

    /* Store locally */
    // sendMsgToBackground(
    //   "submitNewUser", 
    //   {
    //     "platformUrls": platformUrls,
    //     "userId": userId,
    //     "note": note,
    //     "targetDbNamesAndTheirTagNames": dbNamesAndTheirTagNames
    //   }
    // );

    console.log({dbNamesAndTheirTagNames: dbNamesAndTheirTagNames})

    /* Send proof to server */
    fetch('http://localhost:8080/report-data/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "reporter": "chupmu_default_reporter",
        "reported_user": userId,
        "filter_dbs": dbNamesAndTheirTagNames,
        "unixTime": currentPickedUnixTime,
        "url": platformUrls,
        "data_url_array": currentPickedData
      })
    })
      .then(response => response.json())
      .then(response => console.log(response));
  }

  function handleTogglePicker() {
    sendMsgToBackground("togglePicker", {});
    // TODO: change button UI
  }

  function handleIncludePickedItems() {
    sendMsgToBackground("requestPickedItems", {});
  }

  function handleClearPickedItems() {
    document.getElementById("screenshot-area").innerHTML = "";
    resetPickedData();
    sendMsgToBackground("clearPickedItems", {});
  }

  document.getElementById("submit").addEventListener("click", handleSubmit);
  document.getElementById("toggle-picker-button").addEventListener("click", handleTogglePicker);
  document.getElementById("include-picked-button").addEventListener("click", handleIncludePickedItems);
  document.getElementById("clear-picked-button").addEventListener("click", handleClearPickedItems);

}

function startUp() {
  /* Run as stand alone html for testing and developing purposes */
  if (window.location.protocol === "moz-extension:") {
    /* Get communication up */
    portSidebar = browser.runtime.connect({ name: "port-sidebar" });
    sendMsgToBackground("getCurrentPickedUrl", {});

    portSidebar.onMessage.addListener((message, sender) => {
      if (message.info != "chupmu_extension" ||
      message.source != "chupmu_background_script" ||
      message.target != "chupmu_sidebar_script") {
        console.log("SB: unknown message: ", message);
        return;
      }
      if (message.reference == "responseGetCurrentPickedUrl") {
        if (message.error) {
          console.log(`Error: B->SB getCurrentPickedUrl:`, message);
          document.getElementById("sidebar-status").textContent = message.error;
          return;
        }
        console.log(message.message)
        // handleTEMP1(message.message);
      } else if (message.reference == "forceReloadSidebar") {
        startUp();
      } else if (message.reference == "responsePickedItems") {
        let screenshotArea = document.getElementById("screenshot-area");
        currentPickedUnixTime = message.message.unixTime;
        let timestamp = new Date(currentPickedUnixTime).toUTCString();
        message.message.pickedItemPng.forEach(data => {
          // Check eixsting items
          const isIdentical = currentPickedData.some((item) => {
            return item.dataUrl === data.dataUrl;
          });
          if (!isIdentical) {
            // TODO: more sophisticated note taking here
            currentPickedData.push({
              screenshotId: currentScreenshotDataId,
              dataUrl: data.dataUrl,
              description: "",
            });
            // TODO: check if added success, then add raw data to currentPickedData
            // TODO: support editing dataUrl (screenshot data) before submission
            screenshotArea.innerHTML += generateHtmlScreenshotContainer(
              data.captureUrl, timestamp, data.dataUrl, currentScreenshotDataId
            );
            currentScreenshotDataId += 1;
          }
        });
      }
    })
  } else /* if (window.location.protocol === "file:")  */ {
    document.getElementById("sidebar-status").textContent = "Running as stand alone html file.";
    runAsStandAloneHtml();
  }
}

startUp();
