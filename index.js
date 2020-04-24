// Import stylesheets
import "./style.css";
// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";

import * as firebaseui from "firebaseui";

// Document elements
const startRsvpButton = document.getElementById("startRsvp");
const guestbookContainer = document.getElementById("guestbook-container");

const form = document.getElementById("leave-message");
const input = document.getElementById("message");
const guestbook = document.getElementById("guestbook");
const numberAttending = document.getElementById("number-attending");
const rsvpYes = document.getElementById("rsvp-yes");
const rsvpNo = document.getElementById("rsvp-no");

var rsvpListener = null;
var guestbookListener = null;

// Add Firebase project configuration object here
var firebaseConfig = {
  apiKey: "AIzaSyDyfMtijRM05m11li3iC4eJABc4ssEOjJU",
  authDomain: "fir-web-codelab-6d839.firebaseapp.com",
  databaseURL: "https://fir-web-codelab-6d839.firebaseio.com",
  projectId: "fir-web-codelab-6d839",
  storageBucket: "fir-web-codelab-6d839.appspot.com",
  messagingSenderId: "99330144980",
  appId: "1:99330144980:web:6655eeea8cc16be3ba5941"
};

firebase.initializeApp(firebaseConfig);

// FirebaseUI config
const uiConfig = {
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  signInOptions: [
    // Email / Password Provider.
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ],
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      // Handle sign-in.
      // Return false to avoid redirect.
      return false;
    }
  }
};

const ui = new firebaseui.auth.AuthUI(firebase.auth());

startRsvpButton.addEventListener("click", () => {
  if (firebase.auth().currentUser) {
    firebase.auth().signOut();
  } else {
    ui.start("#firebaseui-auth-container", uiConfig);
  }
});

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    startRsvpButton.textContent = "LOGOUT";
    guestbookContainer.style.display = "block";
    subscribeGuestbook();
    subscribeCurrentRSVP(user);
  } else {
    startRsvpButton.textContent = "RSVP";
    guestbookContainer.style.display = "none";
    unsubscribeGuestbook();
    unsubscribeCurrentRSVP();
  }
});

form.addEventListener("submit", e => {
  e.preventDefault();

  firebase
    .firestore()
    .collection("guestbook")
    .add({
      text: input.value,
      timestamp: Date.now(),
      name: firebase.auth().currentUser.displayName,
      userId: firebase.auth().currentUser.uid
    });
  input.value = "";
  return false;
});

function subscribeGuestbook() {
  guestbookListener = firebase
    .firestore()
    .collection("guestbook")
    .orderBy("timestamp", "desc")
    .onSnapshot(snaps => {
      guestbook.innerHTML = "";
      snaps.forEach(doc => {
        const entry = document.createElement("p");
        entry.textContent = doc.data().name + ": " + doc.data().text;
        guestbook.appendChild(entry);
      });
    });
}

function unsubscribeGuestbook() {
  if(guestbookListener != null) {
    guestbookListener();
    guestbookListener = null;
  }
}

function attend(attending){
  const userDoc = firebase.firestore().collection('attendees').doc(firebase.auth().currentUser.uid);
  userDoc.set({
    attending: attending
  }).catch(console.error);
}

rsvpYes.onclick = () => {
 attend(true);
}

rsvpNo.onclick = () => {
  attend(false);
}

firebase.firestore().collection('attendees').where('attending', '==', true).onSnapshot((snap) => {
  const newAttendeeCount = snap.docs.length;
  numberAttending.innerHTML = newAttendeeCount + ' people going';
});

function subscribeCurrentRSVP(user) {
  rsvpListener = firebase.firestore().collection('attendees').doc(user.uid).onSnapshot((doc) => {
    if(doc && doc.data()) {
      const attendingResponse = doc.data().attending;

      if(attendingResponse) {
        rsvpYes.className="clicked";
        rsvpNo.className="";
      } else {
        rsvpYes.className="";
        rsvpNo.className="clicked";
      }
    }
  })
}

function unsubscribeCurrentRSVP() {
  if(rsvpListener != null) {
    rsvpListener();
    rsvpListener = null;
  }
  rsvpYes.className="";
  rsvpNo.className="";
}