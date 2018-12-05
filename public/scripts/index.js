document.addEventListener('DOMContentLoaded', function () {
  // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
  // // The Firebase SDK is initialized and available here!
  //
  // firebase.auth().onAuthStateChanged(user => { });
  // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
  // firebase.messaging().requestPermission().then(() => { });
  // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
  //
  // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

  const userPicElement = document.getElementById('user-pic');
  const userNameElement = document.getElementById('user-name');
  const signInElement = document.getElementById('sign-in');
  const signOutElement = document.getElementById('sign-out');
  const messagesElement = document.getElementById('messages');
  const messageFormElement = document.getElementById('message-form');
  const messageInputElement = document.getElementById('message-input');
  const sendElement = document.getElementById('send');
  const imageFormElement = document.getElementById('image-form');
  const imageInputElement = document.getElementById('image-input');
  const imageButtonElement = document.getElementById('upload');

  try {
    let app = firebase.app();
    let features = ['auth', 'database', 'messaging', 'storage'].filter(feature => typeof app[feature] === 'function');
    document.getElementById('load').innerHTML = `Firebase SDK loaded with ${features.join(', ')}`;

    // triggered when users sign-in or signs-out
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        userPicElement.removeAttribute('hidden');
        const picUrl = user.photoURL;
        if (picUrl) {
          userPicElement.style.backgroundImage = 'url(' + picUrl + ')';
        }
        userNameElement.removeAttribute('attribute');
        userNameElement.textContent = user.displayName;
        signInElement.setAttribute('hidden', true);
        signOutElement.removeAttribute('hidden');
        messageFormElement.removeAttribute('hidden');
        imageFormElement.removeAttribute('hidden');

        saveDeviceToken();
      } else {
        userPicElement.setAttribute('hidden', true);
        userNameElement.setAttribute('hidden', true);
        signInElement.removeAttribute('hidden');
        signOutElement.setAttribute('hidden', true);
        messageFormElement.setAttribute('hidden', true);
        imageFormElement.setAttribute('hidden', true);
      }
    });

    // load messages and attach listeners
    const messagesCallback = function (snap) {
      let div = document.getElementById(snap.key);
      if (!div) {
        div = document.createElement('div');
        div.className = 'message-container';
        div.id = snap.key;
        div.innerHTML = '<div class="pic"></div>' +
          '<div class="message"></div>' +
          '<div class="name"></div>';
        messagesElement.appendChild(div);
      }
      const picUrl = snap.val().profilePicUrl;
      if (picUrl) {
        div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
      }

      div.querySelector('.name').textContent = snap.val().name;
      let messageElement = div.querySelector('.message');
      const text = snap.val().text;
      const imageUrl = snap.val().imageUrl;
      if (text) {
        messageElement.textContent = text;
      } else if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        messageElement.appendChild(img);
      }
    }

    firebase.database().ref('messages').limitToLast(10).on('child_added', messagesCallback);
    firebase.database().ref('messages').limitToLast(10).on('child_changed', messagesCallback);

    signInElement.addEventListener('click', function () {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider);
    });

    signOutElement.addEventListener('click', function () {
      firebase.auth().signOut();
    });

    messageFormElement.addEventListener('submit', function (e) {
      e.preventDefault();
      if (messageInputElement.value && !!firebase.auth().currentUser) {
        firebase.database().ref('messages').push({
          name: firebase.auth().currentUser.displayName,
          text: messageInputElement.value,
          // TODO add placeholder image for profile pic
          profilePicUrl: firebase.auth().currentUser.photoURL
        }).then(function () {
          messageInputElement.value = '';
        }).catch(function (error) {
          console.error(error);
        });
      }
    });

    messageInputElement.addEventListener('keyup', toggleButton);
    messageInputElement.addEventListener('change', toggleButton);

    function toggleButton() {
      if (messageInputElement.value) {
        sendElement.removeAttribute('disabled');
      } else {
        sendElement.setAttribute('disabled', true);
      }
    }

    // uploading images
    imageButtonElement.addEventListener('click', function (e) {
      e.preventDefault();
      imageInputElement.click();
    });

    imageInputElement.addEventListener('change', function (e) {
      e.preventDefault();
      const file = e.target.files[0];

      imageFormElement.reset();

      if (!!firebase.auth().currentUser) {
        firebase.database().ref('messages').push({
          name: firebase.auth().currentUser.displayName,
          // TODO add placeholder image for profile pic
          profilePicUrl: firebase.auth().currentUser.photoURL
        }).then(function (ref) {
          const path = firebase.auth().currentUser.uid + '/' + ref.key + '/' + file.name;
          return firebase.storage().ref(path).put(file).then(function (snap) {
            return snap.ref.getDownloadURL().then(function (url) {
              return ref.update({
                imageUrl: url,
                storageUri: snap.metadata.fullPath
              });
            });
          });
        }).catch(function (error) {
          console.error(error);
        });
      }
    });

    function saveDeviceToken() {
      firebase.messaging().getToken().then(function (token) {
        if (token) {
          console.log('FCM device token:', token);
          firebase.database().ref('deviceTokens').child(token).set(firebase.auth().currentUser.uid);
        } else {
          requestNotificationsPermissions();
        }
      }).catch(function (error) {
        console.error(error);
      });
    }

    function requestNotificationsPermissions() {
      firebase.messaging().requestPermission().then(function () {
        saveDeviceToken();
      }).catch(function (error) {
        console.error(error);
      })
    }

  } catch (e) {
    console.error(e);
    document.getElementById('load').innerHTML = 'Error loading the Firebase SDK, check the console.';
  }
});