
const API_GET_REPORTED_USERS = "reported-user/get-many";


/**
 * 
 * @param {String} baseUrl "http://localhost:8080/"
 * @param {String} apiPath "reported-user/get-many";
 * @param {Array<String>} userids ["150647","797495"]
 * @param {String} platformUrl "stackoverflow.com"
 * @returns List[ReportedUser]
 */
async function get_reported_users_from_remote(baseUrl, apiPath, userids, platformUrl) {
  try {
    const payload = removeDuplicates(userids).map((userId) => ({
      userid: userId,
      platformUrl: platformUrl,
    }));
    const rawResponse = await fetch(`${baseUrl}${apiPath}`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    // Check if the response status indicates success (e.g., 200 OK)
    if (!rawResponse.ok) {
      throw new Error(`HTTP error! Status: ${rawResponse.status}`);
    }

    const content = await rawResponse.json();
    return content.data;
  } catch (error) {
    // Handle the error here (you can log it if needed)
    console.error(error);
    return []; // Return an empty array on error
  }
}
