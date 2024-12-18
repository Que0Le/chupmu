const newDbContainerCode = "__newDb";
const newDbNameInputId = "new-db-name-input";
const newTagInputId = "new-tag-input";


function splitTrimFilterEmpty(string, delimiterChar) {
  return string.split(delimiterChar).map(substring => substring.trim()).filter(item => item !== '')
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
}

/* Run as stand alone html for testing and developing purposes */
if (window.location.protocol === "moz-extension:") {
  // TODO: click on extension icon should also be supported
  browser.runtime.sendMessage({ "reference": 'getCurrentPickedUrl' })
    .then(msg => {
      addDomOnStartUp(msg);
      console.log(msg)
      function handleSubmit() {
        let platformUrls = splitTrimFilterEmpty(document.getElementById("platform-url").value, ",");
        let userId = document.getElementById("user-id").value;
        let note = document.getElementById("note").value;
        let dbNamesAndTheirTagNames = getDbTagData();
        browser.runtime.sendMessage({
          "reference": "submitNewUser",
          "data": {
            "platformUrls": platformUrls,
            "userId": userId,
            "note": note,
            "targetDbNamesAndTheirTagNames": dbNamesAndTheirTagNames
          }
        })
        // console.log({
        //   "platformUrls": platformUrls,
        //   "userId": userId,
        //   "note": note,
        //   "dbAndTags": dbAndTags
        // })
      }

      document.getElementById("submit").addEventListener("click", handleSubmit);
    }, error => console.log(error));
} else if (window.location.protocol === "file:") {
  runAsStandAloneHtml();
}


