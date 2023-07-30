let tags = {
  "0": { "tagId": "0", "description": "Xao lol", "tagname": "xao_lol" },
  "1": { "tagId": "1", "description": "Ga Con", "tagname": "ga_con" },
  "2": { "tagId": "2", "description": "Hieu Biet", "tagname": "hieu_biet" },
  "3": { "tagId": "3", "description": "Dot Con Hay Noi", "tagname": "dot_con_hay_noi" }
}


let msg = {
  "reference": "submitNewUser",
  "data": {
    "platformUrls": [
      "voz.vn"
    ],
    "userId": "dinhdinhbk.1734821",
    "note": "this is note for this user",
    "dbNamesAndTheirTagNames": [
      {
        "dbName": "voz_test_db-12345",
        "tags": [
          "xao_lol",
          "ga_con",
          "dot_con_hay_noi",
          "test11"
        ]
      },
      {
        "dbName": "newdb",
        "tags": [
          "t1",
          "t2",
          "t3"
        ]
      }
    ]
  }
}

function getAllFilterDbNamesAndTheirTags() {
  return new Promise((resolve, reject) => {
    // Some asynchronous operation, e.g., setTimeout
    setTimeout(() => {
      // After the operation is complete, resolve the promise
      let dbNamesAndTheirTags = {
        "voz_test_db-12345": {
          "0": {
            "tagId": "0",
            "description": "Xao lol",
            "tagname": "xao_lol"
          },
          "1": {
            "tagId": "1",
            "description": "Ga Con",
            "tagname": "ga_con"
          },
          "2": {
            "tagId": "2",
            "description": "Hieu Biet",
            "tagname": "hieu_biet"
          },
          "3": {
            "tagId": "3",
            "description": "Dot Con Hay Noi",
            "tagname": "dot_con_hay_noi"
          }
        }
      }
      resolve(dbNamesAndTheirTags);

      // If there was an error, reject the promise
      // reject(new Error("Some error occurred."));
    }, 100); // Simulating an asynchronous operation that takes 1 second
  });
}

function addNewTagToTagsObject(tagsObject, tagNames) {
  let maxTagId = -1;
  let toAddTagNames = JSON.parse(JSON.stringify(tagNames));
  let oldAndNewTagIds = [];
  // Get highest id and also filter out existing tag names
  for (const [key, value] of Object.entries(tagsObject)) {
    const numericTagId = parseInt(tagsObject[key].tagId, 10);
    if (!isNaN(numericTagId) && numericTagId > maxTagId) {
      maxTagId = numericTagId;
    }
    if (tagNames.includes(value.tagname)) {
      oldAndNewTagIds.push(key);
      toAddTagNames = toAddTagNames.filter(str => str !== value.tagname);
      continue;
    }
  }
  // Now, add new tag names
  let newTagsObject = JSON.parse(JSON.stringify(tagsObject));
  toAddTagNames.forEach(newTag => {
    const newTagId = (maxTagId += 1).toString();
    newTagsObject[newTagId] = { tagId: newTagId, description: "", tagname: newTag };
    oldAndNewTagIds.push(newTagId);
  });
  return {newTagsObject, oldAndNewTagIds};
}

function test() {
  // addNewTagToTagsObject(tags, msg.data.dbNamesAndTheirTagNames[0].tags);

  getAllFilterDbNamesAndTheirTags()
    .then(dbNamesAndTheirTags => {
      for (const toAddDbNameAndTagName of msg.data.dbNamesAndTheirTagNames) {
        if (dbNamesAndTheirTags[toAddDbNameAndTagName.dbName]) {
          // add new tags
          const {newTagsObject, oldAndNewTagIds} =  addNewTagToTagsObject(tags, toAddDbNameAndTagName.tags)
          // TODO: add to existing db
          console.log({
            "userid": msg.data.userId,
            "note": msg.data.note,
            "tagIds": oldAndNewTagIds
          })
          // TODO: save to settings
        } else {
          // Create new db
        }
      }
    })


}

test();