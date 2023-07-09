const db_container = `<div class="db-container">
    <div>
      <div>
        <p><label>DB url:</label></p>
        <textarea cols=50 rows=2 name="dbUrl"
          oninput="this.style.height = ''; this.style.height = this.scrollHeight +'px'"></textarea>
      </div>
      <div>
        <p><label>tooltipCss:</label></p>
        <textarea cols=50 rows=5 name="dbCss"
          oninput="this.style.height = ''; this.style.height = this.scrollHeight +'px'"></textarea>
      </div>
    </div>
    <button class="removeButton" onClick="handleRemoveButton(this)">Remove Textarea</button>
  </div>`



function handleRemoveButton(element) {
    let dbContainer = element.parentNode;
    dbContainer.parentNode.removeChild(dbContainer);
}

function handleAddTextareaButton() {
    let dbs = document.getElementById("dbs");
    dbs.innerHTML += db_container;
}

function handleSaveTextareaButton() {
    let allDbContainers = document.getElementsByClassName("db-container");
    for (let i = 0; i < allDbContainers.length; i++) {
        let dbUrl = allDbContainers[i].querySelector('textarea[name="dbUrl"]');
        let dbCss = allDbContainers[i].querySelector('textarea[name="dbCss"]');
        console.log(dbCss.value, dbUrl.value)
    }
}
