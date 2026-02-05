// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAGCJNUbPlqcpJuUyqQTD2XwUTHa6y68Xs",
  authDomain: "businessmanagementtool-cd010.firebaseapp.com",
  projectId: "businessmanagementtool-cd010",
  storageBucket: "businessmanagementtool-cd010.firebasestorage.app",
  messagingSenderId: "722040121657",
  appId: "1:722040121657:web:0d59a921797193bd4720e8",
  measurementId: "G-6RJNT3WZE7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);