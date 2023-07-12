

browser.runtime.sendMessage({reference: 'getCurrentPickedUrl'})
.then(msg => {
    let currentPickedUrl = msg.currentPickedUrl;
    // TODO: set focus so user can write right away
    
    function handleClearButton(event) {
        let pickerContentDbContainer = document.getElementsByClassName("picker-content-container")[0];
        pickerContentDbContainer.querySelector('textarea[name="platformUrl"]').value = "";
        pickerContentDbContainer.querySelector('textarea[name="userId"]').value = "";
        pickerContentDbContainer.querySelector('textarea[name="tagnames"]').value = "";
        pickerContentDbContainer.querySelector('textarea[name="description"]').value = "";
    }
    
    
    function handleSaveTextareaButton() {
        let pickerContentDbContainer = document.getElementsByClassName("picker-content-container")[0];
        let platformUrl = pickerContentDbContainer.querySelector('textarea[name="platformUrl"]').value;
        let userId = pickerContentDbContainer.querySelector('textarea[name="userId"]').value;
        let tagnames = pickerContentDbContainer.querySelector('textarea[name="tagnames"]')
            .value.split(",")
            .map(substring => substring.trim());
        let description = pickerContentDbContainer.querySelector('textarea[name="description"]').value;
        console.log(platformUrl, userId, tagnames, description)
        // TODO
    }
    
    document.getElementById("popup_picker_clear").addEventListener("click", handleClearButton);
    document.getElementById("popup_picker_add").addEventListener("click", handleSaveTextareaButton);

}, error => console.log(error));

