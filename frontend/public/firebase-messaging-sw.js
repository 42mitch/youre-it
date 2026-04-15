// firebase-messaging-sw.js
// This file must be at the root of your public folder

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD0x74WKZRVSXJgfW02sZfrpcPp1VuCAPI",
  authDomain: "tag-game-6c568.firebaseapp.com",
  projectId: "tag-game-6c568",
  storageBucket: "tag-game-6c568.firebasestorage.app",
  messagingSenderId: "716236662780",
  appId: "1:716236662780:web:fc9af5f0e16ab4b424f479",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  self.registration.showNotification(title ?? "You're It!", {
    body: body ?? 'Something happened in the game!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data,
  });
});