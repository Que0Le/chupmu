// Test url
// http://localhost:8080/proof-viewer.html?uid=365102&platform-url=stackoverflow.com

const baseUrl = "http://localhost:8080/";
const getReportMetaUrl = baseUrl + "report-meta/all";
const getReportMetaManyUrl = baseUrl + "report-meta/many";
const getReportDataUrl = baseUrl + "report-data/";
const deleteReportDataUrl = baseUrl + "report-data/";
const confirmReportDataUrl = baseUrl + "report-data/";
const unconfirmReportDataUrl = baseUrl + "report-data/";
const confirmedText = "confirmed";
const unconfirmedText = "unconfirmed";

let currentSelectedReport = null;
let currentSelectedMetaContainer = null;

function convertUnixTimestamp(unixTimestamp) {
  const date = new Date(unixTimestamp); // Convert to milliseconds

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  const hours = date.getHours().toString().padStart(2, '0');;
  const minutes = date.getMinutes().toString().padStart(2, '0');;

  const formattedDate = `${hours}:${minutes} ${day}/${month}/${year}`;
  return formattedDate;
}

/**
 * 
 * @param {String} reportid 
 */
async function getReportDataByReportId(reportid) {
  try {
    const response = await fetch(`${getReportDataUrl}${reportid}`);

    if (!response.ok) {
      const statusText = response.statusText || 'Unknown Status';
      throw new Error(
        `Error getting report id=${reportid} from server. Status: ${response.status} (${statusText})`
      );
    }

    const data = (await response.json()).data;
    return data;
  } catch (error) {
    console.error('Fetch error for getReportData:', error);
  }
}

function generateStatusHtml(reportStatus) {
  let statusHtml = ``;
  if (reportStatus) {
    if (reportStatus === confirmedText) {
      statusHtml = `<span class="bg-green-500">${reportStatus}</span>`;
    } else if (reportStatus === unconfirmedText) {
      statusHtml = `<span class="bg-yellow-500">${reportStatus}</span>`;
    }
  }
  if (!statusHtml) {
    statusHtml = `<span class="bg-red-500">unknow</span>`;
  }
  return statusHtml;
}

// TODO: re-add note entry
function generateUserRecordHtml(uid, platform, relatedPlatforms, tags, status) {
  let tagsHtml = "";
  let relatedPlatformsHtml = "";
  relatedPlatforms.forEach(rp => {
    relatedPlatformsHtml += `<a  style="padding-left:4px" href="${rp}" class="text-blue-500">${rp}</a>`;
  });
  tags.forEach(tag => {
    tagsHtml += `<span  style="padding-left:7px">${tag}</span>`;
  });
  let statusHtml = generateStatusHtml(status);
  let innerHtml = `
  <div class="bg-white rounded-lg shadow p-4 mb-4">
    <h1 class="text-lg font-semibold mb-2">User Record</h1>
    <div>
      <span class="font-semibold">Reported User:</span>
      <span class="font-semibold">${uid}</span>
    </div>
    <div>
      <span class="font-semibold">Report status (confirm if at least one report is confirmed):</span>
      ${statusHtml}
    </div>
    <div>
      <span class="font-semibold">Platform:</span>
      <a href="${platform}" class="text-blue-500">${platform}</a>
    </div>
    <div>
      <span class="font-semibold">Related Platform:</span>
      ${relatedPlatformsHtml}
    </div>
    <div>
      <span class="font-semibold">Tags:</span>
      ${tagsHtml}
    </div>
  </div>`;
  return innerHtml;
}

function generateMetaContainerHtml(reportMeta) {
  let statusHtml = generateStatusHtml(reportMeta.status);
  let creationDetails = `at ${convertUnixTimestamp(reportMeta.unixTime)} by ${reportMeta.reporter}`;
  let innerHtml = `
  <div class="bg-white hover:bg-blue-100 rounded-lg shadow p-4 mb-4 meta-container" reportid="${reportMeta._id}">
    <h2 class="text-lg font-semibold mb-2">${reportMeta.reported_user}</h2>
    <div class="cont-report-platform">
    <p>${reportMeta.platformUrl}</p>
    </div>
    <div class="cont-report-status">
      ${statusHtml}
    </div>
    <p class="cont-platform>${reportMeta.platformUrl}</p>
    <p class="cont-creation-details>${creationDetails}</p>
  </div>`;
  return innerHtml;
}

function generateReportViewerHtml(reportData) {
  let imagesHtml = "";
  reportData.data_url_array.forEach(dataUrl => {
    imagesHtml += `
      <div class="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 m-4">
        <figure class="max-w-lg">
          <img class="h-auto max-w-full rounded-lg" src="${dataUrl.dataUrl}" alt="${dataUrl.description}">
          <figcaption class="mt-2 text-sm text-center text-gray-500 dark:text-gray-400">${dataUrl.description}</figcaption>
        </figure>
      </div>
    `
  });

  let relatedPlatformsInnerHtml = "";
  reportData.relatedPlatforms.forEach(url => {
    relatedPlatformsInnerHtml += `<br><a href="${url}" class="text-blue-500">${url}</a>\n`;
  });

  let statusHtml = generateStatusHtml(reportData.status);


  let innerHtml = `<div class="bg-white rounded-lg shadow-lg p-6">
    <h2 class="text-xl font-semibold mb-4">Report Details</h2>
    <div class="mb-2">
      <span class="font-semibold">Report status:</span>
      ${statusHtml}
    </div>
    <div>
      <button id="delete-report" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-2 rounded">
        Delete Report
      </button>
      <button id="confirm-report" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-2 rounded">
        Confirm Report
      </button>
      <button id="unconfirm-report" class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-2 rounded">
        Unconfirm Report
      </button>
    </div>
    <div class="mb-2">
      <span class="font-semibold">Reporter:</span> ${reportData.reporter}
    </div>
    <div class="mb-2">
      <span class="font-semibold">Reported User:</span> ${reportData.reported_user}
    </div>
    <div class="mb-2">
      <span class="font-semibold">Suggested Tags:</span> ${reportData.tags.join(", ")}
    </div>
    <div class="mb-2">
      <span class="font-semibold">Recorded Url:</span> ${reportData.urlRecorded}
    </div>
    <div class="mb-2">
      <span class="font-semibold">Platform URL:</span> 
      <a href="${reportData.platformUrl}" class="text-blue-500">${reportData.platformUrl}</a>
    </div>
    <div class="mb-2">
      <span class="font-semibold">Related Platforms:</span> 
      ${relatedPlatformsInnerHtml}
    </div>
    <div class="mb-2">
      <span class="font-semibold">Taken at:</span> ${convertUnixTimestamp(reportData.unixTime)}
    </div>
    <div class="mb-2">
      <span class="font-semibold">Screenshots:</span>
      <div>
        ${imagesHtml}
      </div>
    </div>
  </div>`;

  return innerHtml;
}



async function reloadCurrentReportViewerAndMetaContainer(reportid) {
  let data = await getReportDataByReportId(reportid)
  console.log(data)
  // Update meta container
  let statusDom = currentSelectedMetaContainer.querySelectorAll("div.cont-report-status")[0];
  statusDom.innerHTML = generateStatusHtml(data.status);
  // Update report data viewer
  var clickEvent = new Event("click");
  clickEvent.data = data;
  currentSelectedMetaContainer.dispatchEvent(clickEvent);
}

async function reloadPage() {
  location.reload();
  const metaContainers = document.querySelectorAll('.meta-container');
  if (metaContainers[0]) {
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    metaContainers[0].dispatchEvent(clickEvent);
  }
}

async function handleDeleteReport(event) {
  try {
    const response = await fetch(deleteReportDataUrl + currentSelectedReport._id, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    await reloadPage();
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

async function handleConfirmReport(event) {
  try {
    const response = await fetch(
      confirmReportDataUrl + currentSelectedReport._id,
      {
        method: "PUT",
        body: JSON.stringify({ "status": confirmedText }),
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    await reloadCurrentReportViewerAndMetaContainer(currentSelectedReport._id);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

async function handleUnconfirmReport(event) {
  try {
    const response = await fetch(unconfirmReportDataUrl + currentSelectedReport._id, {
      method: "PUT",
      body: JSON.stringify({ "status": unconfirmedText }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    await reloadCurrentReportViewerAndMetaContainer(currentSelectedReport._id);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

async function showSelectedReportData(event, data = null) {
  // Use event delegation to make sure the outer div meta container is selected
  let reportid = event.currentTarget.getAttribute("reportid");
  if (!reportid) return;
  // Get report data if not provided
  if (!data) {
    data = await getReportDataByReportId(reportid)
    if (!data) return;
  }
  console.log(data)
  currentSelectedReport = data;
  // Construct the view
  let viewScroll = document.getElementById("y-scroll-right");
  let viewContainer = generateReportViewerHtml(data);
  viewScroll.innerHTML = viewContainer ? viewContainer : "Error viewing data!";

  document.getElementById("delete-report").addEventListener("click", handleDeleteReport);
  document.getElementById("confirm-report").addEventListener("click", handleConfirmReport);
  document.getElementById("unconfirm-report").addEventListener("click", handleUnconfirmReport);
}

let queryUserId = "";
let queryPlatform = "";

async function startupViewerPage() {
  const urlParams = new URLSearchParams(document.location.search);
  queryUserId = urlParams.get("uid");
  queryPlatform = urlParams.get("platform-url");
  // force reload page if query invalid
  if ((!queryUserId) ^ (!queryPlatform)) {
    location.href = location.href.split('?')[0];
  }

  let data = null;
  let response = null;
  // Fetch data from server
  try {
    // For queried mode
    if (queryUserId && queryPlatform) {
      console.log(`Page with query: queryUserId=${queryUserId} queryPlatform=${queryPlatform}`);
      response = await fetch(
        `${getReportMetaManyUrl}?uid=${queryUserId}&platform_url=${queryPlatform}`,
      );
    // For all mode. TODO: pagination
    } else {
      console.log(`Page without query. Getting all meta data.`);
      response = await fetch(getReportMetaUrl);
    }
    if (!response.ok) {
      throw new Error(`Get report data meta: HTTP error! Status: ${response.status}`);
    }
    data = (await response.json()).data;
    console.log(data);
  } catch (error) {
    console.error('Fetch error:', error);
  }

  // Create User view if needed:
  if (queryUserId && queryPlatform) {
    let userRecordArea = document.getElementById("user-record-area");
    let ruRelatedPlatforms = [];  // ru = reported user
    let ruTags = [];
    let ruStatus = "";
    for (let i = 0; i < data.length; i++) {
      let reportMeta = data[i]
      if (reportMeta && reportMeta.status && reportMeta.status === confirmedText) {
        if (!ruStatus) { ruStatus = confirmedText };
        ruTags = [...ruTags, ...reportMeta.tags];
        ruRelatedPlatforms = [...ruRelatedPlatforms, ...reportMeta.relatedPlatforms];
      }
    }
    ruTags = [...(new Set(ruTags))];
    ruRelatedPlatforms = [...(new Set(ruRelatedPlatforms))];

    let userRecordHtml = generateUserRecordHtml(
      queryUserId, queryPlatform, ruRelatedPlatforms, ruTags, ruStatus
    );
    userRecordArea.innerHTML = userRecordHtml;
  }

  // Display data in meta containers
  let metaScroll = document.getElementById("y-scroll-left");
  
  data.forEach(reportMeta => {
    // console.log(reportMeta)
    let metaContainer = generateMetaContainerHtml(reportMeta);
    metaScroll.innerHTML += metaContainer;
  });
  
  const metaContainers = document.querySelectorAll('.meta-container');
  
  metaContainers.forEach(element => {
    element.addEventListener('click', function(event) {
      // Toggle selection effect
      if (currentSelectedMetaContainer) {
        currentSelectedMetaContainer.classList.remove("bg-blue-200");
      }
      currentSelectedMetaContainer = event.currentTarget;
      currentSelectedMetaContainer.classList.add("bg-blue-200");
      // Handle creating view
      showSelectedReportData(event)
    });
  });
  
  // Select the first meta container by default:
  if (metaContainers[0]) {
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    metaContainers[0].dispatchEvent(clickEvent);
  }
}

startupViewerPage();
