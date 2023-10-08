
const getReportMetaUrl = "http://localhost:8080/report-meta/";
const getReportDataUrl = "http://localhost:8080/report-data/";

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
  })


  let innerHtml = `<div class="bg-white rounded-lg shadow-lg p-6">
    <h2 class="text-xl font-semibold mb-4">Report Details</h2>
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


function handleMetaContainerClick(event) {
  let reportid  = this.getAttribute("reportid");
  if (!reportid) {return}
  fetch(`${getReportDataUrl}${reportid}`)
  .then(response => {
    if (!response.ok) {
      throw new Error(`Error getting report id=${reportid} from server. Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log(data);
    let viewScroll = document.getElementById("y-scroll-right");
    let viewContainer = generateReportViewerHtml(data.data);
    viewScroll.innerHTML = viewContainer ? viewContainer : "Error viewing data!";
  })
  .catch(error => {
    console.error('Fetch error:', error);
  });
}

fetch(getReportMetaUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    // Handle the JSON data
    console.log(data);
    let metaScroll = document.getElementById("y-scroll-left");
    data.data.forEach(reportMeta => {
      console.log(reportMeta)
      let meta = `at ${convertUnixTimestamp(reportMeta.unixTime)} by ${reportMeta.reporter}`;
      let metaContainer = generateMetaContainerHtml(reportMeta._id, reportMeta.reported_user, meta, reportMeta.url);
      metaScroll.innerHTML += metaContainer;
    });
    const clickableElements = document.querySelectorAll('.meta-container');
    clickableElements.forEach(element => {
      element.addEventListener('click', handleMetaContainerClick);
    });
  })
  .catch(error => {
    console.error('Fetch error:', error);
  });