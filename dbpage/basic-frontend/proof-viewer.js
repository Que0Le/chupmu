
const getReportMetaUrl = "http://localhost:8080/report-meta/";

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
  let innerHtml = `<div class="bg-white rounded-lg shadow p-4 mb-4" reportid="${reportId}">
    <h2 class="text-lg font-semibold mb-2">${title}</h2>
    <p>${meta}</p>
    <p>${mainText}</p>
  </div>`;
  return innerHtml;
}


// Make the GET request using fetch
fetch(getReportMetaUrl)
  .then(response => {
    // Check if the request was successful (status code in the range of 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    // Parse the response JSON and return it as a promise
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
  })
  .catch(error => {
    // Handle errors
    console.error('Fetch error:', error);
  });