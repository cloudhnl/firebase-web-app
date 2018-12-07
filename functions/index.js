const functions = require('firebase-functions');
const admin = require('firebase-admin');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

admin.initializeApp();

exports.welcomeMessage = functions.auth.user().onCreate(async (user) => {
  await admin.database().ref('messages').push({
    name: 'Welcome Bot',
    profilePicUrl: 'https://firebase.google.com/downloads/brand-guidelines/SVG/logo-logomark.svg',
    text: `Welcome ${user.displayName}!`
  });
});

exports.sendNotifications = functions.database.ref('messages/{messageId}').onCreate(
  async (snapshot) => {
    const text = snapshot.val().text;
    const payload = {
      notification: {
        title: `${snapshot.val().name} posted ${text ? 'a message' : 'an image'}`,
        body: text ? (text.length <= 100 ? text : text.substring(0, 97) + '...') : '',
        icon: snapshot.val().profilePicUrl,
        click_action: `https://${process.env.GCLOUD_PROJECT}.firebaseapp.com`,
      }
    };

    const allTokens = await admin.database().ref('deviceTokens').once('value');
    if (allTokens.exists()) {
      const tokens = Object.keys(allTokens.val());

      const response = await admin.messaging().sendToDevice(tokens, payload);

      const tokensToRemove = {};
      response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
          // Cleanup the tokens who are not registered anymore.
          if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            tokensToRemove[`/deviceTokens/${tokens[index]}`] = null;
          } else {
            console.error('Failure sending notification to', tokens[index], error);
          }
        }
      });
      await admin.database().ref().update(tokensToRemove);
    }
  }
)