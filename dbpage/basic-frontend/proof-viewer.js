
const baseUrl = "http://localhost:8080/";
const getReportMetaUrl = baseUrl + "report-meta/";
const getReportDataUrl = baseUrl + "report-data/";
const deleteReportDataUrl = baseUrl + "report-data/";
const confirmReportDataUrl = baseUrl + "report-data/";
const unconfirmReportDataUrl = baseUrl + "report-data/";
const confirmedText = "confirmed";
const unconfirmedText = "unconfirmed";

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

function generateMetaContainerHtml(reportId, title, meta, mainText) {
  let innerHtml = `<div class="bg-white rounded-lg shadow p-4 mb-4 meta-container" reportid="${reportId}">
    <h2 class="text-lg font-semibold mb-2">${title}</h2>
    <p>${meta}</p>
    <p>${mainText}</p>
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

  let statusHtml = ``;
  if (reportData.status) {
    if (reportData.status === confirmedText) {
      statusHtml = `<span class="bg-green-500">${reportData.status}</span>`;
    } else if (reportData.status === unconfirmedText) {
      statusHtml = `<span class="bg-yellow-500">${reportData.status}</span>`;
    }
  }
  if (!statusHtml) {
    statusHtml = `<span class="bg-red-500">${unknown}</span>`;
  }


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
      <span class="font-semibold">Reporter:</span> r1
    </div>
    <div class="mb-2">
      <span class="font-semibold">Reported User:</span> ${reportData.reporter}
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

let currentSelectedReport = null;
let currentSelectedMetaContainer = null;

async function reloadCurrentReportViewer() {
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
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
    const response = await fetch(confirmReportDataUrl + currentSelectedReport._id, {
      method: "PUT",
      body: JSON.stringify({ "status": confirmedText }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    await reloadCurrentReportViewer();
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

    await reloadCurrentReportViewer();
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

async function handleMetaContainerClick(event) {
  currentSelectedMetaContainer = this;
  let reportid = this.getAttribute("reportid");

  if (!reportid) { return; }

  try {
    const response = await fetch(`${getReportDataUrl}${reportid}`);

    if (!response.ok) {
      throw new Error(`Error getting report id=${reportid} from server. Status: ${response.status}`);
    }

    const data = await response.json();
    currentSelectedReport = data.data;
    console.log(currentSelectedReport);

    let viewScroll = document.getElementById("y-scroll-right");
    let viewContainer = generateReportViewerHtml(data.data);
    viewScroll.innerHTML = viewContainer ? viewContainer : "Error viewing data!";

    // buttons
    document.getElementById("delete-report").addEventListener("click", handleDeleteReport);
    document.getElementById("confirm-report").addEventListener("click", handleConfirmReport);
    document.getElementById("unconfirm-report").addEventListener("click", handleUnconfirmReport);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

async function startupViewerPage() {
  try {
    const response = await fetch(getReportMetaUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Handle the JSON data
    console.log(data);
    let metaScroll = document.getElementById("y-scroll-left");

    data.data.forEach(reportMeta => {
      console.log(reportMeta)
      let meta = `at ${convertUnixTimestamp(reportMeta.unixTime)} by ${reportMeta.reporter}`;
      let metaContainer = generateMetaContainerHtml(reportMeta._id, reportMeta.reported_user, meta, reportMeta.url);
      metaScroll.innerHTML += metaContainer;
    });

    const metaContainers = document.querySelectorAll('.meta-container');

    metaContainers.forEach(element => {
      element.addEventListener('click', handleMetaContainerClick);
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
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

startupViewerPage();
