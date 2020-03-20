const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

//ここから追記
exports.hello = functions.https.onRequest((request,response) => {
    if(request.query.name !== undefined){
        response.send("Hello " + request.query.name + " !");
    } else {
        response.send("Hello from Firebase!");
    }
});