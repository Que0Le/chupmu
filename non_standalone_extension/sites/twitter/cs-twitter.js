console.log("Startup Twitter script ...");

const regexProfileLink = /twitter\.com\/([^/]+)/;
const thisPlatformUrl = "twitter.com";
const classPrefix = "cm_";
const classPrefixRegex = /(cm_)\S*/;
const cmPopupContentClassname = "cm-popup-content";
const cmPopupContainerClassname = "cm-popup-container";
const cmPopupPrefixId = "cm-popup-userid-";

const tag_color = {
  "humble": {color: "#5ea758", tid: "1"},
  "wise": {color: "#47894b", tid: "2"},
  "good-news-source": {color: "#5ea758", tid: "3"},
  "pro-uca": {color: "#52b8ff", tid: "6"},
  "neutral": {color: "#f3faff", tid: "4"},
  "pro-palestine": {color: "#ff7251", tid: "5"},
  "fake-news": {color: "#181716", tid: "7"},
  "idiot": {color: "#553311", tid: "8"},
  "spammer": {color: "#ccaa66", tid: "9"},
  "pro-rus": {color: "#9b2948", tid: "10"},
}
const default_tag_color = "blue";

const cssStringPopup = `
.${cmPopupContainerClassname} {
  position: relative;
  display: inline-block;
}

.${cmPopupContentClassname} {
  position: absolute;
  display: none;
  background-color: rgba(241, 241, 241, 1);
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.${cmPopupContainerClassname}:hover .${cmPopupContentClassname} {
  display: block;
}`;
let styleElementId = "chupmu_css";
// let currentCss = [];
let portContent = browser.runtime.connect({ name: "port-cs" });

// let currentMouseOverDomElement;

function removeDuplicates(array) {
  return array.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });
}

/**
 * 
 * @param {String} reference 
 * @param {Object} message 
 */
async function sendMsgToBackground(reference, message) {
  return new Promise((resolve, reject) => {
    portContent.postMessage({
      info: "chupmu_extension",
      reference: reference,
      source: "chupmu_content_script",
      target: "chupmu_background_script",
      message: message,
    });

    // Resolve when the message is sent successfully
    portContent.onMessage.addListener((response) => {
      resolve(response);
    });

    // Reject if there's an error sending the message
    portContent.onDisconnect.addListener(() => {
      reject(new Error("Port disconnected"));
    });
  });
}

function generatePopupHtml(reportedUser, dbOnlineUserFilesQueryUrl) {
  let tagsString = reportedUser.tags.join(", ");
  let onlineUserFileString = `${dbOnlineUserFilesQueryUrl}`
    + `?userid=${reportedUser.userid}` 
    + `&platform=${reportedUser.platformUrl}`;
  let innerHtml = `
  <div class="${cmPopupContentClassname}" id="${cmPopupPrefixId}${reportedUser.userid}">
    <p>UserId: 
    <a href="${onlineUserFileString}">${reportedUser.userid}</a><br>
    </p>
    <p>Tags: ${tagsString}</p>
    <div>Note: ${reportedUser.note}</div>
  </div>
  `;
  return innerHtml;
}

let pickerActive = false;
let pickedElements = [];
let currentPickingElement;
// this variable is a attempt to reduce risk of endless loop
// when remove highlight effect on howevered and picked items
let encounterHovers = 0;

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
    removeHoverHighlight();
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
      currentPickingElement.style.outline = 'red solid 2px';
    }
  }
  encounterHovers += 1;
}


function handleElementClick(event) {
  if (pickerActive) {
    if (pickedElements.includes(currentPickingElement)) {
      // Remove from list
      currentPickingElement.style.outline = '';
      pickedElements.splice(pickedElements.indexOf(currentPickingElement), 1);
    } else {
      // Mark the element green
      currentPickingElement.style.outline = 'green solid 2px';
      pickedElements.push(currentPickingElement);
    }
  }
}

function removeHoverHighlight() {
  let max_try = 100;
  let i = 0;
  let highlightedElement = document.querySelector('[style="outline: red solid 2px;"]');
  while (i < max_try && highlightedElement) {
    console.log("C: removing outlined item ...");
    highlightedElement.style.outline = '';
    i++;
    highlightedElement = document.querySelector('[style="outline: red solid 2px;"]');
  }
}

function removePickedItem() {
  let max_try = 100;
  let i = 0;
  let highlightedElement = document.querySelector('[style="outline: green solid 2px;"]');
  while (i < max_try * 2 && highlightedElement) {
    console.log("C: removing selected item ...");
    highlightedElement.style.outline = '';
    i++;
    highlightedElement = document.querySelector('[style="outline: green solid 2px;"]');
  }
  pickedElements = [];
  currentPickingElement = null;
}


/**
 * 
 * @returns {String[]}
 */
async function getAllUserIdsOnPage() {
  let userids = [];

  let spanElements;
  spanElements = document.querySelectorAll('span');
  spanElements.forEach(span => {
    const textContent = span.textContent;
    if (textContent.startsWith('@')) {
      userids.push(textContent.slice(1));
    }
  });
  console.log(userids)
  return removeDuplicates(userids);
}

async function removeElementById(id) {
  const elementToRemove = document.getElementById(id);
  if (elementToRemove) {
    await new Promise((resolve) => {
      elementToRemove.parentNode.removeChild(elementToRemove);
      resolve();
    });
  }
}

async function applyLabel(data) {
  // Cleanup
  removeElementById(styleElementId);
  let customCss = "";

  // Add css class to element
  let reportedUsers = data.reportedUsers;
  let dbOnlineUserFilesQueryUrl = data.dbOnlineUserFilesQueryUrl;
  let spanUsers = []
  let spanElements = document.querySelectorAll('span');
  spanElements.forEach(span => {
    const textContent = span.textContent;
    if (textContent.startsWith('@')) {
      spanUsers.push(span);
    }
  });
  // console.log(spanUsers)

  for (let i = 0; i < spanUsers.length; i++) {
    let su = spanUsers[i];
    const userid = su.textContent;
    for (let j = 0; j < reportedUsers.length; j++) {
      let reportedUser = reportedUsers[j];
      if (`@${reportedUser.userid}` === userid) {
        console.log(reportedUser)
        // Create CSS class if needed
        let stepWide = Math.floor(100/reportedUser.tags.length)
        let dashKeyframes = `@keyframes dash_${i}_${j} {\n`;
        let dashClass = `.${classPrefix}_${i}_${j} {
          border: 4px dashed white;
          animation: dash_${i}_${j} 5s infinite;
        }`
        for (let k = 0; k < reportedUser.tags.length; k++) {
          let thisColor = tag_color[reportedUser.tags[k]] ? 
            tag_color[reportedUser.tags[k]].color : default_tag_color;
            dashKeyframes += `${k * stepWide}% {border-color: ${thisColor};}\n`;
        }
        dashKeyframes += "}";
        customCss += `${dashKeyframes}\n${dashClass}\n`;
        
        // Add CSS class highlight effects
        su.classList.add(`${cmPopupContainerClassname}`);
        su.classList.add(`${classPrefix}_${i}_${j}`);
        // Add popup
        su.innerHTML += generatePopupHtml(reportedUser, dbOnlineUserFilesQueryUrl);
        // break;
      }
    }
  }
  customCss += `${cssStringPopup}`;
  const styleElement = document.createElement("style");
  styleElement.setAttribute("id", styleElementId);
  styleElement.innerText = customCss;
  document.head.appendChild(styleElement);
}

function handleRemoveLabel() {
  // Remove highlight classes from page's nodes
  let allUserDetails = document.querySelectorAll(`div[class*="${classPrefix}"]`);
  for (let i = 0; i < allUserDetails.length; i++) {
    allUserDetails[i].classList.remove(classPrefixRegex.exec(allUserDetails[i].className)[0]);
  }
  // Remove css
  removeElementById(styleElementId);

  // Remove popup
  const elements = document.getElementsByClassName(cmPopupContentClassname);
  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0]);
  }
}

async function askBackgroundForRecords(userids) {
    await sendMsgToBackground("requestRecords", {
      currentUrl: document.location.href,
      userids: userids,
      thisPlatformUrl: thisPlatformUrl,
    });
  }

const handleMessage = async (message) => {
  if (message.info !== "chupmu_extension" ||
    message.source !== "chupmu_background_script" ||
    message.target !== "chupmu_content_script") {
    return;
  }

  if (message.reference === "toggleLabelify") {
    console.log("Request B->C: toggleLabelify ...");
    if (message.message === "label") {
      console.log("command: label");
      const userids = await getAllUserIdsOnPage();
      await askBackgroundForRecords(userids);
    } else if (message.message === "removeLabel") {
      console.log("command: removeLabel");
      handleRemoveLabel();
    }
  } else if (message.reference === "responseRecords") {
    /* Data is an array of db's meta, and records */
    console.log(`Get responseRecords records data from background: `, message.message);
    applyLabel(message.message);
  } else if (message.reference === "requestExtractUserIdFromUrl") {
    console.log(`B->C: ${message.reference}`);
    let userid = "";
    const match = message.message.currentPickedUrl.match(regexProfileLink);
      if (match && match.length > 1) {
        userid = match[1].toString();
    }
    // try {
    //   const response = await browser.runtime.sendMessage({ "userid": userid });
    // } catch (error) {
    //   console.log(`Error: ${error}`);
    // }
    sendMsgToBackground("responseExtractUserIdFromUrl", { "userid": userid });
  } else if (message.reference === "togglePicker") {
    console.log(`B->C: ${message.reference}`);
    togglePicker();
  } else if (message.reference === "requestPickedItems") {
    let imgDescs = [];
    pickedElements.forEach(element => {
      // Get position of the selected elements and send to Background to make a screenshot
      // TODO: remove duplicated
      let domRect = element.getBoundingClientRect();
      // https://developer.mozilla.org/en-US/docs/Mozilla/
      // Add-ons/WebExtensions/API/extensionTypes/ImageDetails
      let rect = {
        x: domRect.x + document.documentElement.scrollLeft,
        y: domRect.y + document.documentElement.scrollTop,
        width: domRect.width, height: domRect.height
      };
      imgDescs.push({rect: rect, screenshotNote: ""});
    });
    sendMsgToBackground("responsePickedItems", { imgDescs: imgDescs });
  } else if (message.reference === "clearPickedItems") {
    console.log("B->C: clearPickedItems");
    removePickedItem();
  } else if (message.reference === "pickCurrentDomElement") {
    console.log(`B->C: ${message.reference}`);
    handleElementClick(null);
  } else if (message.reference === "endPickSession") {
    console.log(`B->C: ${message.reference}`);
    document.removeEventListener('mouseover', handleElementMouseOver);
    document.removeEventListener('click', handleElementClick);
    removeHoverHighlight();
    removePickedItem();
    pickerActive = false;
  }
};

portContent.onMessage.addListener(handleMessage);

