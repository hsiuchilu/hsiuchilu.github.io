// File: /api/visitor-stats.js

// We need to use 'require' here as this is a Node.js environment
const { initializeApp, getApps, getApp } = require("firebase/app");
const { getFirestore, doc, setDoc, getDoc, increment } = require("firebase/firestore");

// Your Firebase configuration, pulled securely from Vercel's Environment Variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase App (check if it's already initialized)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// This is the main function Vercel will run
module.exports = async (req, res) => {
  try {
    const statsRef = doc(db, "pagestats/homepage"); // Path to your document in Firestore

    // Increment the view count
    await setDoc(statsRef, { views: increment(1) }, { merge: true });
    const docSnap = await getDoc(statsRef);
    const viewCount = docSnap.exists() ? docSnap.data().views : 1;

    // Get visitor's IP from the request headers provided by Vercel
    const visitorIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Fetch location data
    const geoResponse = await fetch(`https://ipapi.co/${visitorIp}/json/`);
    const geoData = await geoResponse.json();
    const location = (geoData.city && geoData.country_name) ? `${geoData.city}, ${geoData.country_name}` : 'an unknown location';

    // Send the data back to the frontend as JSON
    res.status(200).json({
      views: viewCount,
      location: location,
    });

  } catch (error) {
    console.error("Error in serverless function:", error);
    res.status(500).json({ error: 'Could not process request.' });
  }
};