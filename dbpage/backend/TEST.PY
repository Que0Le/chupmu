from pymongo import MongoClient

uri = "mongodb+srv://chupmu-nosql-01.wg7jmod.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority"
client = MongoClient(uri,
                     tls=True,
                     tlsCertificateKeyFile='.mg_cert.pem')
db = client['db1']
collection = db['c1']
doc_count = collection.count_documents({})
print(doc_count)