// Open the IndexedDB
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = function (event) {
      reject("Error opening database");
    };

    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      const objectStore = db.createObjectStore(DB_STORE_NAME, { keyPath: 'userid', autoIncrement: false });
      objectStore.createIndex('userid', 'userid', { unique: true });
      objectStore.createIndex('record', 'record', { unique: false });
    };

    request.onsuccess = function (event) {
      const db = event.target.result;
      resolve(db);
    };
  });
}


function writeEntryToDb(dbName, date) {
  openDb()
    .then(db => {
      const transaction = db.transaction(dbName, 'readwrite');
      const objectStore = transaction.objectStore(dbName);
      const request = objectStore.add(date);
      request.onerror = function (event) {
        // TODO: better error handler
        console.error('Error adding data', event.target.error);
      };
      request.onsuccess = function (event) {
        console.log('Data added successfully');
      };
      transaction.oncomplete = function () {
        console.log('Transaction completed');
        db.close();
      };
    })
    .catch(error => {
      console.error('Error opening database:', error);
    });
}

// Write data to the IndexedDB
function writeData() {
  openDb()
    .then(db => {
      const transaction = db.transaction(DB_STORE_NAME, 'readwrite');
      const objectStore = transaction.objectStore(DB_STORE_NAME);

      const data = [
        { name: 'John', age: 25, userid: 0 },
        { name: 'Jane', age: 30, userid: 3 },
        { name: 'Bob', age: 35, userid: 4 }
      ];

      data.forEach(item => {
        const request = objectStore.add(item);
        request.onerror = function (event) {
          console.error('Error adding data', event.target.error);
        };
        request.onsuccess = function (event) {
          console.log('Data added successfully');
        };
      });

      transaction.oncomplete = function () {
        console.log('Transaction completed');
        db.close();
      };
    })
    .catch(error => {
      console.error('Error opening database:', error);
    });
}

// Read data from the IndexedDB
function readData() {
  openDb()
    .then(db => {
      const transaction = db.transaction(DB_STORE_NAME, 'readonly');
      const objectStore = transaction.objectStore(DB_STORE_NAME);

      const request = objectStore.getAll();
      request.onerror = function (event) {
        console.error('Error reading data', event.target.error);
      };
      request.onsuccess = function (event) {
        const data = event.target.result;
        console.log('Data read successfully:', data);
        db.close();
      };
    })
    .catch(error => {
      console.error('Error opening database:', error);
    });
}


/* Get filter databases that support this url */
// TODO: more sophisticated solution to filter out supported url-set
/**
 * 
 * @param {String} url 
 * @returns Array of dbName strings
 */
function getFilterDbNamesForUrl(url) {
  return new Promise((resolve, reject) => {
    let supportedDb = [];
    browser.storage.local.get(`${EXT_NAME}_dbUrls`).then(data => {
      let supportedUrls = data[`${EXT_NAME}_dbUrls`];
      Object.entries(supportedUrls).forEach(([platformUrl, databaseNames]) => {
        if (url.includes(platformUrl)) {
          supportedDb.push(...databaseNames);
        }
      });
      resolve([...new Set(supportedDb)]);
    }).catch(error => {
      reject(error);
    });
  });
}


/**
 * Get all dbNammes from local storage setting
 * @returns Array of db names
 */
function getAllFilterDbNames() {
  return new Promise((resolve, reject) => {
    browser.storage.local.get(`${EXT_NAME}_config`).then(data => {
      let config = data[`${EXT_NAME}_config`];
      const dbNames = config.dbSources.map(source => source.dbName);
      resolve(dbNames)
    }).catch(error => {
      reject(error);
    });
  });
}


/**
 * Get all dbNammes and their tags (name or full with id) from local storage setting
 * @param {boolean} onlyTagName 
 * @returns Array of objects {dbName and tags}
 */
function getAllFilterDbNamesAndTheirTags(onlyTagName = false) {
  return new Promise((resolve, reject) => {
    browser.storage.local.get(`${EXT_NAME}_config`).then(data => {
      let config = data[`${EXT_NAME}_config`];
      let result = {};
      const dbNames = config.dbSources.map(source => {
        if (onlyTagName) {
          let tags = [];
          for (const [key, value] of Object.entries(source.tags)) {
            tags.push(value.tagname);
          }
          result[source.dbName] = tags;
        } else {
          result[source.dbName] = source.tags;
        }
      });
      resolve(result)
    }).catch(error => {
      reject(error);
    });
  });
}


/**
 * 
 * @param {Int[]} ids Array of user id. Integer, but wil be changed to support i.e uuid
 * @returns Array of record objects
 */
function getRawRecordsFromFilterDb(dbStoreName, ids) {
  return new Promise((resolve, reject) => {
    // console.log(`getting records (if any) for id set: `, ids, dbStoreName);
    openDb()
      .then(db => {
        const transaction = db.transaction(dbStoreName, 'readonly');
        const objectStore = transaction.objectStore(dbStoreName);

        let result = {};
        const getPromises = ids.map(id => {
          return new Promise((resolve, reject) => {
            const request = objectStore.get(id);
            request.onerror = function (event) {
              console.error('Error reading data', event.target.error);
              reject(event.target.error);
            };
            request.onsuccess = function (event) {
              const data = event.target.result;
              if (data) {
                // console.log('Data read successfully:', data);
                result[id] = data;
              }
              resolve();
            };
          });
        });

        Promise.all(getPromises)
          .then(() => {
            db.close();
            resolve(result);
          })
          .catch(error => {
            db.close();
            reject(error);
          });
      })
      .catch(error => {
        console.error('Error opening database:', error);
        reject(error);
      });
  });
}

function test() {
  let tags = { 
    "0": { "tagId": "0", "description": "Xao lol", "tagname": "xao_lol" }, 
    "1": { "tagId": "1", "description": "Ga Con", "tagname": "ga_con" }, 
    "2": { "tagId": "2", "description": "Hieu Biet", "tagname": "hieu_biet" }, 
    "3": { "tagId": "3", "description": "Dot Con Hay Noi", "tagname": "dot_con_hay_noi" } 
  }

  let maxKeyId = -Infinity;
  
  for (const key in tags) {
    const numericKey = parseInt(key, 10);
    if (!isNaN(numericKey) && numericKey > maxKeyId) {
      maxKeyId = numericKey;
    }
  }
  let newTagsObject = JSON.parse(JSON.stringify(tags));
  
  let msg = {
    "reference": "submitNewUser",
    "data": {
      "platformUrls": [
        "voz.vn"
      ],
      "userId": "dinhdinhbk.1734821",
      "note": "this is note for this user",
      "dbAndTags": [
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
  getAllFilterDbNamesAndTheirTags(true)
  .then(dbNamesAndTheirTagNames => {
    for (const toAddDbNameAndTagName of msg.data.dbAndTags) {
      if (dbNamesAndTheirTagNames[toAddDbNameAndTagName.dbName]) {
        // add to existing db
        // get tag ids
        for (const [key, value] of Object.entries(msg.dbNamesAndTheirTagNames)) {

        }

      } else {
        // Create new db
      }
    }
  })
}