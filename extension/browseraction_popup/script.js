const newDbContainerCode = "__newDb";

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

function generateNewDbContainer(dbName) {
  let innerHtml = `<div class="db-container">
    <div class="db-entry">
    <p><label>New DB name:</label></p>
    <input type="text" dbname="${dbName}">
    </div>
    <div class="tag-entry">`;
  innerHtml += `</div>
    <p><label>New tags (split with comma):</label></p>
    <input type="text" dbname="${dbName}">
  </div>`
  return innerHtml;
}

const data = {
  "currentPickedUrl": "https://voz.vn/t/noi-quy-cua-dien-dan-chi-tiet-tung-muc.1583/#post-105462",
  "availableDbNames": {
    "_db1": ["_tag11", "_tag12"],
    "_db2": ["_tag22", "_tag23"],
  }
}



let dbArea = document.getElementById("db-area");
for (const [key, value] of Object.entries(data.availableDbNames)) {
  dbArea.innerHTML += generateInnerHtmlDbContainer(key, value)
}
dbArea.innerHTML += generateNewDbContainer("__newDb")

function handleSubmit() {
  let checkedDbs = document.querySelectorAll("input[type='checkbox'][isdbname]:checked");

  for (const cd of checkedDbs) {
    let dbName = cd.value;
    let tags = [];
    let tagInputs = document.querySelectorAll(`input[type='checkbox'][dbname='${dbName}']:checked`);
    for (const ti of tagInputs) {
      tags.push(ti.value)
    }
    let newTags = document.querySelector(`input[type='text'][dbname='${dbName}']`)
      .value.split(",")
      .map(substring => substring.trim()).filter(item => item !== '')
    tags.push(...newTags)
    tags = [...new Set(tags)]
    console.log(dbName, tags)
  }

}

document.getElementById("submit").addEventListener("click", handleSubmit);

