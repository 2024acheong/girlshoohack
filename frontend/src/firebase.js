// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBc8tY73TbS-qRlX934vK3AHxkW2npbiM8",
  authDomain: "calorie-tracking-app-49bdd.firebaseapp.com",
  projectId: "calorie-tracking-app-49bdd",
  storageBucket: "calorie-tracking-app-49bdd.appspot.com",
  messagingSenderId: "354416464622",
  appId: "1:354416464622:web:b9792c83503f65e37099ff",
  measurementId: "G-Y5Z0KGWXM0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };