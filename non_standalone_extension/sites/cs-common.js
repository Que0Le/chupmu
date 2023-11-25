function test(msg) {
    console.log(`Test common: ${msg}`);
}

console.log("cs-commmon loaded")


// const handleMessage = async (message) => {
//     if (message.info !== "chupmu_extension" ||
//       message.source !== "chupmu_background_script" ||
//       message.target !== "chupmu_content_script") {
//       return;
//     }
  
//     if (message.reference === "toggleLabelify") {
//       console.log("Request B->C: toggleLabelify ...");
//       if (message.message === "label") {
//         console.log("command: label");
//         const userids = await getAllUserIdsOnPage();
//         await askBackgroundForRecords(userids);
//       } else if (message.message === "removeLabel") {
//         console.log("command: removeLabel");
//         handleRemoveLabel();
//       }
//     } else if (message.reference === "responseRecords") {
//       /* Data is an array of db's meta, and records */
//       console.log(`Get responseRecords records data from background: `, message.message);
//       applyLabel(message.message);
//     } else if (message.reference === "requestExtractUserIdFromUrl") {
//       console.log(`B->C: ${message.reference}: ${message.message.currentPickedUrl}`);
//       let userid = "";
//       const match = message.message.currentPickedUrl.match(regexProfileLink);
//       if (match && match.length > 1) {
//         userid = match[1].toString();
//       }
//       sendMsgToBackground("responseExtractUserIdFromUrl", { "userid": userid });
//     } else if (message.reference === "togglePicker") {
//       console.log(`B->C: ${message.reference}`);
//       togglePicker();
//     } else if (message.reference === "requestPickedItems") {
//       let imgDescs = [];
//       pickedElements.forEach(element => {
//         // Get position of the selected elements and send to Background to make a screenshot
//         // TODO: remove duplicated
//         let domRect = element.getBoundingClientRect();
//         // https://developer.mozilla.org/en-US/docs/Mozilla/
//         // Add-ons/WebExtensions/API/extensionTypes/ImageDetails
//         let rect = {
//           x: domRect.x + document.documentElement.scrollLeft,
//           y: domRect.y + document.documentElement.scrollTop,
//           width: domRect.width, height: domRect.height
//         };
//         imgDescs.push({ rect: rect, screenshotNote: "" });
//       });
//       sendMsgToBackground("responsePickedItems", { imgDescs: imgDescs });
//     } else if (message.reference === "clearPickedItems") {
//       console.log("B->C: clearPickedItems");
//       removePickedItem();
//     } else if (message.reference === "pickCurrentDomElement") {
//       console.log(`B->C: ${message.reference}`);
//       handleElementClick(null);
//     } else if (message.reference === "endPickSession") {
//       console.log(`B->C: ${message.reference}`);
//       document.removeEventListener('mouseover', handleElementMouseOver);
//       document.removeEventListener('click', handleElementClick);
//       removeHoverHighlight();
//       removePickedItem();
//       pickerActive = false;
//     }
//   };
  