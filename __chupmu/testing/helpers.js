const urlRegex = /^https:\/\/voz\.vn\/t\//;
// https://www.w3schools.com/css/css_tooltip.asp

let TOOLTIP_CSS = `
.tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: black;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 0;

  /* Position the tooltip */
  position: absolute;
  z-index: 1;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
}
`
let tags = ["xao_lol", "ga_con", "hieu_biet", "dot_con_hay_noi"]

let VOZ_CSS = `
.chupmu_css_${tags[0]} {
  background: pink !important;
}

.chupmu_css_${tags[1]} {
  background: green !important;
}

.chupmu_css_${tags[2]} {
  background: blue !important;
}

.chupmu_css_${tags[3]} {
  background: red !important;
}
`;


function sendMsgToTab(tab, reference, msg) {
  console.log(reference)
  browser.tabs.sendMessage(
    tab.id,
    {
      info: "chupmu_extension", reference: reference,
      source: "chupmu_background_script", target: "chupmu_content_script",
      message: msg
    })
    .then((response) => {
      console.log(`Answer C->B:`);
      console.log(response);
    })
    .catch(exception => console.log(exception));
}

/*  Init  page action */
const TITLE_APPLY = "Apply CSS";
const TITLE_REMOVE = "Remove CSS";
const APPLICABLE_PROTOCOLS = ["http:", "https:"];
/*
Toggle CSS: based on the current title, insert or remove the CSS.
Update the page action's title and icon to reflect its state.
*/
function toggleLabelify(tab) {
  function toggle(title) {
    if (title === TITLE_APPLY) {
      // sendMsgToTab(tab, "toggleLabelify", "label");
      browser.pageAction.setIcon({ tabId: tab.id, path: "icons/on.svg" });
      browser.pageAction.setTitle({ tabId: tab.id, title: TITLE_REMOVE });
      browser.tabs.insertCSS({ code: TOOLTIP_CSS });
      browser.tabs.insertCSS({ code: VOZ_CSS });
      portFromCS.postMessage(
        {
            info: "chupmu_extension", reference: "toggleLabelify",
            source: "chupmu_background_script", target: "chupmu_content_script",
            message: "label"
        });
    } else {
      // sendMsgToTab(tab, "toggleLabelify", "remove_label");
      browser.pageAction.setIcon({ tabId: tab.id, path: "icons/off.svg" });
      browser.pageAction.setTitle({ tabId: tab.id, title: TITLE_APPLY });
      browser.tabs.removeCSS({ code: TOOLTIP_CSS });
      browser.tabs.removeCSS({ code: VOZ_CSS });
      portFromCS.postMessage(
        {
            info: "chupmu_extension", reference: "toggleLabelify",
            source: "chupmu_background_script", target: "chupmu_content_script",
            message: "removeLabel"
        });
    }
  }

  // TODO: comfirm msg from content script
  let gettingTitle = browser.pageAction.getTitle({ tabId: tab.id });
  gettingTitle.then(title => {
    toggle(title);
  });
}

/*
Initialize the page action: set icon and title, then show.
Only operates on tabs whose URL's protocol is applicable.
*/
function initializePageAction(tab) {
  if (urlRegex.test(tab.url)) {
    browser.pageAction.setIcon({ tabId: tab.id, path: "icons/off.svg" });
    browser.pageAction.setTitle({ tabId: tab.id, title: TITLE_APPLY });
    browser.pageAction.show(tab.id);
  }
}

  