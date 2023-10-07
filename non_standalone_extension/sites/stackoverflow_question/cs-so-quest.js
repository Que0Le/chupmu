console.log("Startup stackoverflow script ...");

const regexProfileLink = /\/users\/(\d+)\//;

const chupmu_class_prefix = "chupmu_";
const chupmu_css_class_prefix = "chupmu_css_";
const chupmu_css_class_prefix_Regex = /(chupmu_css_)\S*/;

let currentCss = [];
let portContent = browser.runtime.connect({ name: "port-cs" });


/**
 * 
 * @param {String} reference 
 * @param {Object} message 
 */
function sendMsgToBackground(reference, message) {
  portContent.postMessage({
    info: "chupmu_extension", reference: reference,
    source: "chupmu_content_script", target: "chupmu_background_script",
    message: message
  });
}

function createTooltipHtml(tootipId, tagnames, note, recordUrl) {
  let str = `
<span class="${chupmu_class_prefix} tooltiptext" id="${tootipId}">
    <p>Tags: ${tagnames}</p>
    <p>Note: ${note}</p>
    <p>View full record: <a href="${recordUrl}">chup-mu.org</a></p>
</span>
`
  return str;
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
  console.log(userids)
  return userids;
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

const classPrefix = "cm_";
const classPrefixRegex = /(cm_)\S*/;

const cssString = `
.cm_nice-answer {
  background: green;
}
.cm_polite {
  background: blue;
}
.cm_creative {
  background: red;
}`;

let styleElementId = "chupmu_css";

async function applyLabel(data) {
  // Cleanup
  removeElementById(styleElementId);

  // Add css
  const styleElement = document.createElement("style");
  styleElement.setAttribute("id", "styleElement");
  // const cssRule = ".my-class { background: green; }";
  styleElement.innerText = cssString;
  document.head.appendChild(styleElement);

  // Add css class to element
  let udElements = document.getElementsByClassName("user-details");
  for (let i = 0; i < udElements.length; i++) {
    let ud = udElements[i];
    let a = ud.getElementsByTagName("a")[0];
    if (!a) continue;
    let profileLink = a.href
    const match = profileLink.match(regexProfileLink);
    if (match && match.length > 1) {
      const userid = match[1].toString();
      for (let j = 0; j < data.length; j++) {
        let reportedUser = data[j];
        if (reportedUser.userid === userid) {
          ud.classList.add(`${classPrefix}${reportedUser.tags[0]}`);
          break;
        }
      }
    }
  }
}

function handleRemoveLabel() {
  // Remove classes
  let allUserDetails = document.querySelectorAll(`div[class*="${classPrefix}"]`);
  for (let i = 0; i < allUserDetails.length; i++) {
    allUserDetails[i].classList.remove(classPrefixRegex.exec(allUserDetails[i].className)[0]);
  }
  // Remove css
  removeElementById(styleElementId);

  // Tooltips
  // const elements = document.getElementsByClassName(chupmu_class_prefix);
  // while (elements.length > 0) {
  //   elements[0].parentNode.removeChild(elements[0]);
  // }
}

function askBackgroundForRecords(userids) {
  sendMsgToBackground("requestRecords", { 
    "currentUrl": document.location.href, "userids": userids 
  });
}

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
      // Send the current CSS code back to background to be removed
      // sendMsgToBackground("removeCurrentCss", { "currentCss": currentCss });
    }
  } else if (message.reference === "responseRecords") {
    /* Data is a array of db's meta, and records */
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
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/extensionTypes/ImageDetails
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

