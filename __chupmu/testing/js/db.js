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