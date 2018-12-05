// Firebase will specifically look for and register firebase-message-sw.js
// This service worker will recieve and display browser notifications.
importScripts('/__/firebase/5.6.0/firebase-app.js');
importScripts('/__/firebase/5.6.0/firebase-messaging.js');
importScripts('/__/firebase/init.js');

firebase.messaging();