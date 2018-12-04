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
      } else {
        userPicElement.setAttribute('hidden', true);
        userNameElement.setAttribute('hidden', true);
        signInElement.removeAttribute('hidden');
        signOutElement.setAttribute('hidden', true);
        messageFormElement.setAttribute('hidden', true);
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
      if (text) {
        messageElement.textContent = text;
      }
      // TO DO load photos
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

    // TODO add placeholder image
    messageFormElement.addEventListener('submit', function (e) {
      e.preventDefault();
      if (messageInputElement.value && !!firebase.auth().currentUser) {
        firebase.database().ref('messages').push({
          name: firebase.auth().currentUser.displayName,
          text: messageInputElement.value,
          profilePicUrl: firebase.auth().currentUser.photoURL
        }).catch(function (error) {
          console.log(error);
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
  } catch (e) {
    console.error(e);
    document.getElementById('load').innerHTML = 'Error loading the Firebase SDK, check the console.';
  }
});

