console.log("Startup stackoverflow script ...");

const regexProfileLink = /\/users\/(\d+)\//;
const thisPlatformUrl = "stackoverflow.com";

// const chupmu_class_prefix = "chupmu_";
// const chupmu_css_class_prefix = "chupmu_css_";
// const chupmu_css_class_prefix_Regex = /(chupmu_css_)\S*/;

const classPrefix = "cm_";
const classPrefixRegex = /(cm_)\S*/;
const cmPopupContentClassname = "cm-popup-content";
const cmPopupContainerClassname = "cm-popup-container";
const cmPopupPrefixId = "cm-popup-userid-";

const cssString = `
.cm_nice-answer {
  background: green;
}
.cm_polite {
  background: blue;
}
.cm_creative {
  background: red;
}
.${cmPopupContainerClassname} {
  position: relative;
  display: inline-block;
}

.${cmPopupContentClassname} {
  position: absolute;
  display: none;
  background-color: #f1f1f1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
    if (pickedElements.includes(event.target)) {
      // Remove from list
      event.target.style.outline = '';
      pickedElements.splice(pickedElements.indexOf(event.target), 1);
    } else {
      // Mark the element green
      event.target.style.outline = 'green solid 2px';
      pickedElements.push(event.target);
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
// const regexProfileLink = /\/users\/(\d+)\//;

async function getAllUserIdsOnPageSO() {
  let userids = [];

  // Use async queries and loops
  const allUserDetailsA = document.querySelectorAll('div.user-details a');
  await Promise.all(Array.from(allUserDetailsA).map(async (uda) => {
    if (uda.href) {
      const match = uda.href.match(regexProfileLink);
      if (match && match.length > 1) {
        userids.push(match[1].toString());
      }
    }
  }));

  const allCommentA = document.querySelectorAll('div.d-inline-flex.ai-center a');
  await Promise.all(Array.from(allCommentA).map(async (uda) => {
    if (uda.href) {
      const match = uda.href.match(regexProfileLink);
      if (match && match.length > 1) {
        userids.push(match[1].toString());
      }
    }
  }));
  // console.log(userids)
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

  // Add css
  const styleElement = document.createElement("style");
  styleElement.setAttribute("id", "styleElement");
  styleElement.innerText = cssString;
  document.head.appendChild(styleElement);

  // Add css class to element
  let reportedUsers = data.reportedUsers;
  let dbOnlineUserFilesQueryUrl = data.dbOnlineUserFilesQueryUrl;
  let udElements = document.getElementsByClassName("user-details");
  for (let i = 0; i < udElements.length; i++) {
    let ud = udElements[i];
    let a = ud.getElementsByTagName("a")[0];
    if (!a) continue;
    let profileLink = a.href
    const match = profileLink.match(regexProfileLink);
    if (match && match.length > 1) {
      const userid = match[1].toString();
      for (let j = 0; j < reportedUsers.length; j++) {
        let reportedUser = reportedUsers[j];
        if (reportedUser.userid === userid) {
          // Add highlight effects
          ud.classList.add(`${cmPopupContainerClassname}`);
          ud.classList.add(`${classPrefix}${reportedUser.tags[0]}`);
          // Add popup
          ud.innerHTML += generatePopupHtml(reportedUser, dbOnlineUserFilesQueryUrl);
          break;
        }
      }
    }
  }
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
      const userids = await getAllUserIdsOnPageSO();
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
  }
};

portContent.onMessage.addListener(handleMessage);

/* 
portContent.onMessage.addListener((message) => {
  if (message.info !== "chupmu_extension" ||
    message.source !== "chupmu_background_script" ||
    message.target !== "chupmu_content_script") {
    return;
  }

  if (message.reference === "toggleLabelify") {
    console.log("Request B->C: toggleLabelify ...");
    if (message.message === "label") {
      console.log("command: label")
      getAllUserIdsOnPageSO()
        .then(userids => {
          askBackgroundForRecords(userids);
        })
    } else if (message.message === "removeLabel") {
      console.log("command: removeLabel")
      handleRemoveLabel();
    }
  } else if (message.reference === "responseRecords") {
    // Data is a array of db's meta, and records 
    console.log(`Get responseRecords records data from background: `, message.message);
    applyLabel(message.message);
  } else if (message.reference === "togglePicker") {
    console.log("B->C: togglePicker");
    togglePicker();
  } else if (message.reference === "requestPickedItems") {
    let imgRects = [];
    pickedElements.forEach(element => {
      // Get position of the selected elements and send to Background to make screenshot
      // TODO: remove duplicated
      let domRect = element.getBoundingClientRect();
      // https://developer.mozilla.org/en-US/docs/Mozilla/
      // Add-ons/WebExtensions/API/extensionTypes/ImageDetails
      let rect = {
        x: domRect.x + document.documentElement.scrollLeft,
        y: domRect.y + document.documentElement.scrollTop,
        width: domRect.width, height: domRect.height
      };
      imgRects.push(rect);
    });
    sendMsgToBackground("responsePickedItems", { "imgRects": imgRects });
  } else if (message.reference === "clearPickedItems") {
    console.log("B->C: clearPickedItems");
    removePickedItem();
  }
});

 */