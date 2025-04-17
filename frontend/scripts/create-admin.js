// Script to create admin users in Firebase Firestore
// Usage: node create-admin.js <email>

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const { getAuth, getUserByEmail } = require('firebase/auth');

// Firebase configuration (same as in your app)
const firebaseConfig = {
  apiKey: "AIzaSyDB3RSnurgvV8kVYPOpvh4NUC9G9FlUfCg",
  authDomain: "asha-ai.firebaseapp.com",
  projectId: "asha-ai",
  storageBucket: "asha-ai.firebasestorage.app",
  messagingSenderId: "441392935110",
  appId: "1:441392935110:web:1e3613f204815442fa27c7",
  measurementId: "G-NZ5PSCQYB4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function createAdmin(email) {
  try {
    console.log(`Looking up user with email: ${email}`);
    
    // Get user by email to find their UID
    const userRecord = await getUserByEmail(email);
    const uid = userRecord.uid;
    
    console.log(`Found user with UID: ${uid}`);
    
    // Create an admin document in the admins collection
    await setDoc(doc(db, 'admins', uid), {
      email: email,
      role: 'admin',
      createdAt: new Date().getTime()
    });
    
    console.log(`Successfully set ${email} as admin`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address: node create-admin.js <email>');
  process.exit(1);
}

// Create admin
createAdmin(email); 