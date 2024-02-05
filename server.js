const WebSocket = require('ws');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

const mongoose = require('mongoose')

const mongoURL = 'mongodb://127.0.0.1:27017';
const dbName = 'est';
//  WebSocket server
const wss = new WebSocket.Server({ port: 8080 });


wss.on('connection', function connection(ws) {
    console.log('New WebSocket connection established.');

    // Send initial data to client

    ws.on('message', function incoming(message) {
        const messageString = message.toString('utf8');
        console.log('Received message:', messageString);//buffer message

        const { action, id, newData } = JSON.parse(messageString);
        console.log(action, newData);
        MongoClient.connect("mongodb://127.0.0.1:27017/est")
            .then(async (client) => {
                console.log("Successfully MongoDB connected")
                const db = client.db(dbName)
                const collection = db.collection('employees')
                console.log(action)
                switch (action) {
                    case 'create':
                
                        collection.insertOne(newData, function (err, result) {
                        console.log("Enter")
                            if (err) {
                                console.log('err')
                                return
                            }
                            ws.send(JSON.stringify({ action: "createresponse", success: true }))
                            
                        })
                        ws.send(JSON.stringify({ action: "createresponse", success: true }))

                        break;
                    case 'read':
                        
                        if (ws.readyState === ws.OPEN) {
                            try {
                                const update_id = new ObjectId(id);

                                const items = id ?  await collection.findOne({_id:update_id}) : await collection.find().toArray();
                                const emptyResponse = { action: "readresponse", data: items };
                                const emptyResponseString = JSON.stringify(emptyResponse);
                                ws.send(emptyResponseString);

                                
                            } catch (err) {
                                console.error('Error fetching items:', err);
                                
                            }
                        }
                        break;
                    case 'update':
                        try {
                            const e = await collection.findOneAndUpdate(  
                                { _id: new ObjectId(id)  }, 
                                { $set: newData }, 
                                { returnDocument: 'after' }
                            );

                            if (e.value) {
                                ws.send(JSON.stringify({ action: "updateresponse", success: true }));
                            } else {
                                ws.send(JSON.stringify({ action: "updateresponse", success: false, message: "Item not found" }));
                            }                        }
                        catch (err) {
                            console.error('Error fetching items:', err);
                        }
                        break;
                    case 'delete':
                        const delete_id = new ObjectId(id);
                        console.log(delete_id)
                        try {
                            const deletedData = await collection.deleteOne({ _id: delete_id });
                            console.log('Deleted Data:', deletedData);
                            ws.send(JSON.stringify({ action: "deleteresponse", success: true }))
                        } catch (err) {
                            console.error('Error fetching items:', err);
                        }
                        break;
                    default:
                        console.log('Invalid action:', action);
                }
            })
            .catch((error) => {
                console.error('Error connected to mongodb:', error)
            });
        
    });


    ws.on('close', function close() {
        console.log('WebSocket connection closed.');
    });
});






