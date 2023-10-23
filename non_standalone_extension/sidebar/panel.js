const newDbContainerCode = "__newDb";
const newDbNameInputId = "new-db-name-input";
const newTagInputId = "new-tag-input";
let portSidebar;
let currentPickedData = [];
let currentPickedUnixTime = 0;

function resetPickedData() {
  currentPickedData = [];
  currentPickedUnixTime = 0;
}

let currentScreenshotDataId = 0; 
let currentPickedUrl = "";
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

function generateHtmlScreenshotContainer(screenshotNote, timestamp, dataUrl, screenshotId) {
  let innerHtml = `
  <div class="screenshot-container">
    <div class="screenshot-note">${screenshotNote}</div>
    <div class="screenshot-timestamp">${timestamp}</div>
    <img src="${dataUrl}">
    <input placeholder="Description" screenshot-id="${screenshotId}" value=${screenshotNote}>
  </div>`;
  return innerHtml;
}

function addDomOnStartUp(msg) {
  document.getElementById("raw-url").value = msg.currentPickedUrl;
  document.getElementById("platform-url").value = msg.suggestedPlatformUrl;
  document.getElementById("user-id").value = msg.suggestedUserId;
  document.getElementById("tags").value = msg.suggestedTags.join(', ');
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

function handleTEMP1(data) {
  // currentPickedUrl = data.currentPickedUrl;
  document.getElementById("sidebar-status").textContent = "Picking:";
  addDomOnStartUp(data);

  function handleSubmit() {
    /* Gather data */
    let userId = document.getElementById("user-id").value;
    let note = document.getElementById("note").value;
    let tags = document.getElementById("tags").value;
    tags = [...new Set(tags.split(',').map(item => item.trim()).filter(Boolean))];
    let platformUrl = document.getElementById("platform-url").value.trim();
    let relatedPlatforms = splitTrimFilterEmpty(document.getElementById("related-platforms").value, ",");
    // let dbNamesAndTheirTagNames = getDbTagData();
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
        "note": note,
        "tags": tags,
        "unixTime": currentPickedUnixTime,
        "urlRecorded": data.urlRecorded, 
        "platformUrl": platformUrl,
        "relatedPlatforms": relatedPlatforms,
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

  function handleEndPick() {
    sendMsgToBackground("endPickSession", {});
  }

  document.getElementById("submit").addEventListener("click", handleSubmit);
  document.getElementById("toggle-picker-button").addEventListener("click", handleTogglePicker);
  document.getElementById("include-picked-button").addEventListener("click", handleIncludePickedItems);
  document.getElementById("clear-picked-button").addEventListener("click", handleClearPickedItems);
  document.getElementById("end-pick-button").addEventListener("click", handleEndPick);

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
        // console.log(message.message)
        handleTEMP1(message.message);
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
              description: data.screenshotNote,
            });
            // TODO: check if added success, then add raw data to currentPickedData
            // TODO: support editing dataUrl (screenshot data) before submission
            screenshotArea.innerHTML += generateHtmlScreenshotContainer(
              data.screenshotNote, timestamp, data.dataUrl, currentScreenshotDataId
            );
            currentScreenshotDataId += 1;
          }
        });
      }
    })
  } else /* if (window.location.protocol === "file:")  */ {
    document.getElementById("sidebar-status").textContent = "Running as a stand alone html file.";
    // runAsStandAloneHtml();
  }
}

startUp();
