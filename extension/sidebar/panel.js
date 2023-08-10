const newDbContainerCode = "__newDb";
const newDbNameInputId = "new-db-name-input";
const newTagInputId = "new-tag-input";
let portSidebar;

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
  dbArea.innerHTML += generateContainerForNewDb("__newDb")
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

let pickerActive = false;
let pickedElements = [];
let currentPickingElement;
let encounterHovers = 0;
function runAsStandAloneHtml() {
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
    let imageContainer = document.getElementById("test2");
    imageContainer.innerHTML = "";

    let canvas = document.createElement('canvas');
    pickedElements.forEach(element => {
      canvas.width = element.offsetWidth;
      canvas.height = element.offsetHeight;
      html2canvas(element, { scale: 0.5 })
        .then(function (canvas) {
          let ctx = canvas.getContext('2d');
          ctx.drawImage(canvas, 0, 0);
          let dataURL = canvas.toDataURL();
          console.log(dataURL.length);

          const img = document.createElement('img');
          img.src = dataURL;
          imageContainer.appendChild(img);
        }
      );
    })
  }
  document.getElementById("include-picked-button").addEventListener("click", handleIncludePickedItems);

  // TODO: Testing exporting image
  // var element = document.getElementById('input-area');
  // var canvas = document.createElement('canvas');
  // canvas.width = element.offsetWidth;
  // canvas.height = element.offsetHeight;
  // html2canvas(element, { scale: 0.5 }).then(function (canvas) {
  //   var ctx = canvas.getContext('2d');
  //   ctx.drawImage(canvas, 0, 0);
  //   var dataURL = canvas.toDataURL();
  //   console.log(dataURL.length);

  //   const img = document.createElement('img');
  //   img.src = dataURL;
  //   document.body.appendChild(img);

  //   // document.getElementById('downloadimage').addEventListener("click", function (e) {
  //   //   var dataURLImage = canvas.toDataURL("image/jpeg", 1.0);
  //   //   downloadImage(dataURLImage, 'my-canvas.jpeg');
  //   // });
  // });

  // Save | Download image
  // function downloadImage(data, filename = 'untitled.jpeg') {
  //     var a = document.createElement('a');
  //     a.href = data;
  //     a.download = filename;
  //     document.body.appendChild(a);
  //     a.click();
  // }

}

function handleTEMP1(data) {
  document.getElementById("sidebar-status").textContent = "Picking:";
  addDomOnStartUp(data);

  function handleSubmit() {
    let platformUrls = splitTrimFilterEmpty(document.getElementById("platform-url").value, ",");
    let userId = document.getElementById("user-id").value;
    let note = document.getElementById("note").value;
    let dbNamesAndTheirTagNames = getDbTagData();
    portSidebar.postMessage({
      "reference": "submitNewUser",
      "data": {
        "platformUrls": platformUrls,
        "userId": userId,
        "note": note,
        "targetDbNamesAndTheirTagNames": dbNamesAndTheirTagNames
      }
    });
  }

  function handleTogglePicker() {
    portSidebar.postMessage({
      info: "chupmu_extension", reference: "togglePicker",
      source: "chupmu_sidebar_script", target: "chupmu_background_script",
      message: ""
    });
    // TODO: change button UI
  }

  function handleIncludePickedItems() {
    portSidebar.postMessage({
      info: "chupmu_extension", reference: "requestPickedItems",
      source: "chupmu_sidebar_script", target: "chupmu_background_script",
      message: ""
    });
  }

  document.getElementById("submit").addEventListener("click", handleSubmit);
  document.getElementById("toggle-picker-button").addEventListener("click", handleTogglePicker);
  document.getElementById("include-picked-button").addEventListener("click", handleIncludePickedItems);

}

function startUp() {
  /* Run as stand alone html for testing and developing purposes */
  if (window.location.protocol === "moz-extension:") {
    /* Get communication up */
    portSidebar = browser.runtime.connect({ name: "port-sidebar" });

    portSidebar.postMessage({ 
      info: "chupmu_extension", reference: 'getCurrentPickedUrl',
      source: "chupmu_sidebar_script", target: "chupmu_background_script",
    });

    portSidebar.onMessage.addListener((message, sender) => {
      // console.log(`SB portSidebar message: `, message);
      if (message.reference == "responseGetCurrentPickedUrl") {
        if (message.error) {
          console.log(`Error: B->SB getCurrentPickedUrl:`, message);
          document.getElementById("sidebar-status").textContent = message.error;
          return;
        }
        handleTEMP1(message.data);
      } else if (message.reference == "forceReloadSidebar") {
        startUp();
      } else if (message.reference == "responsePickedItems") {
        console.log(message);
      }
    })
  } else /* if (window.location.protocol === "file:")  */ {
    document.getElementById("sidebar-status").textContent = "Running as stand alone html file.";
    runAsStandAloneHtml();
  }
}

startUp();
