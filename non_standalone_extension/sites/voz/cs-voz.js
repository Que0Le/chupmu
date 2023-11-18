console.log("Startup VOZ script ...");

const regexProfileLink = /\/u\/\S+\.(\d+)/;
const thisPlatformUrl = "voz.vn";
const classPrefix = "cm_";
const classPrefixRegex = /(cm_)\S*/;
const cmPopupContentClassname = "cm-popup-content";
const cmPopupContainerClassname = "cm-popup-container";
const cmPopupPrefixId = "cm-popup-userid-";
const maxTryFindArticleDom = 10;

const tag_color = {
  "thong-minh": { color: "#aad688", tid: "14" },
  "private-list": { color: "red", tid: "15" },
  "gioi": { color: "#5ea758", tid: "1" },
  "biet-nhieu": { color: "#47894b", tid: "2" },
  "tri-thuc": { color: "#00e6ff", tid: "3" },
  "noi-hay": { color: "#adf7ff", tid: "4" },
  "Humorous": { color: "#1b65cd", tid: "5" },
  "Easy-going": { color: "#9fc7ff", tid: "6" },
  "Amusing": { color: "#fdff78", tid: "7" },
  "polite": { color: "#ce5a57", tid: "8" },
  "ngu": { color: "#ff7251", tid: "9" },
  "bo-do": { color: "#9b2948", tid: "10" },
  "deo-biet-gi": { color: "#efc070", tid: "11" },
  "pro-nga": { color: "#e47025", tid: "12" },
  "troll": { color: "#634217", tid: "13" },
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
    + `?uid=${reportedUser.userid}`
    + `&platform-url=${reportedUser.platformUrl}`;
  let innerHtml = `
  <div class="${cmPopupContentClassname}" id="${cmPopupPrefixId}${reportedUser.userid}">
    <span>UserId: <a href="${onlineUserFileString}">${reportedUser.userid}</a></span>
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

/**
 * Picking article DOM is not easy. 
 * We enforce this function to help only and always selecting article DOM
 * @param {Dom element} currentElement 
 * @returns 
 */
function findArticleElement(currentElement) {
  let parentElement = currentElement;
  for (let i = 0; i < maxTryFindArticleDom; i++) {
    if (!parentElement) return null;
    if (parentElement.tagName.toLowerCase() == 'article' &&
      parentElement.classList.contains('message')) {
      return parentElement;
    }
    parentElement = parentElement.parentElement;
  }
  return null;
}

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
  let articleElement = findArticleElement(event.target);
  let potentialPickingElement = articleElement ? articleElement : event.target;

  if (currentPickingElement !== potentialPickingElement) {
    if (currentPickingElement && !pickedElements.includes(currentPickingElement)) {
      currentPickingElement.style.outline = '';
    }
    currentPickingElement = potentialPickingElement;
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
  document.querySelectorAll('section.message-user a.username').forEach((aUsername) => {
    // Extract the last part of the href attribute
    const userid = aUsername.href.split('.').pop().slice(0, -1);
    if (userid) {
      userids.push(userid);
    }
  });

  return [...(new Set(userids))]
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

  let reportedUsers = data.reportedUsers;
  let dbOnlineUserFilesQueryUrl = data.dbOnlineUserFilesQueryUrl;

  // Add css class to element if matched:
  let allSections = document.querySelectorAll('section.message-user');
  for (let i = 0; i < allSections.length; i++) {
    section = allSections[i];
    let aUsernames = section.querySelectorAll('a.username');
    if (aUsernames.length == 0) continue;
    const userid = aUsernames[0].href.split('.').pop().slice(0, -1);
    for (let j = 0; j < reportedUsers.length; j++) {
      let reportedUser = reportedUsers[j];
      if (reportedUser.userid !== userid) continue;
      // Create CSS class if needed
      let dashKeyframes = `@keyframes dash_${i}_${j} {\n`;
      let dashClass = `.${classPrefix}_${i}_${j} {
        border: 4px dashed white;
        animation: dash_${i}_${j} 5s infinite;
      }`;
      // Count tags that we have color code available
      let available_tag_colors = [];
      reportedUser.tags.forEach(tag => {
        if (tag_color[tag]) {
          available_tag_colors.push(tag_color[tag])
        }
      });
      if (available_tag_colors.length == 0) {
        // we don't have pre-defined color. Use default:
        dashKeyframes += `100% {border-color: ${default_tag_color};}\n`;
      } else {
        // Add default color if at least one tag is unknown
        if (available_tag_colors.length < reportedUser.tags.length) {
          available_tag_colors.push({ color: default_tag_color });
        }
        let stepWide = Math.floor(100 / available_tag_colors.length)
        for (let k = 0; k < available_tag_colors.length; k++) {
          dashKeyframes += `${k * stepWide}% {border-color: ${available_tag_colors[k].color};}\n`;
        }
      }
      dashKeyframes += "}";
      customCss += `${dashKeyframes}\n${dashClass}\n`;

      // Add CSS class highlight effects
      section.classList.add(`${cmPopupContainerClassname}`);
      section.classList.add(`${classPrefix}_${i}_${j}`);
      // Add popup
      section.innerHTML += generatePopupHtml(reportedUser, dbOnlineUserFilesQueryUrl);
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
    console.log(`B->C: ${message.reference}: ${message.message.currentPickedUrl}`);
    let userid = "";
    const match = message.message.currentPickedUrl.match(regexProfileLink);
    if (match && match.length > 1) {
      userid = match[1].toString();
    }
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
      imgDescs.push({ rect: rect, screenshotNote: "" });
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
