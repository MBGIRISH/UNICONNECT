/**
 * Cleanup Script - Remove All Test Data
 * 
 * This script removes all test data from Firebase:
 * - Events
 * - Groups
 * - Messages
 * - Marketplace listings
 * - Resources
 * 
 * Run with: npx tsx scripts/cleanup-test-data.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, collectionGroup } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCEnrTZlR-6DrxnRT8secbbidjfw5vzIyc",
  authDomain: "campus-connect-fd225.firebaseapp.com",
  projectId: "campus-connect-fd225",
  storageBucket: "campus-connect-fd225.firebasestorage.app",
  messagingSenderId: "258370587794",
  appId: "1:258370587794:web:86b682bbcb6ef5d068aa4b",
  measurementId: "G-PPW76QX696"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function deleteCollection(collectionName: string) {
  try {
    console.log(`\n🗑️  Deleting all ${collectionName}...`);
    const snapshot = await getDocs(collection(db, collectionName));
    console.log(`   Found ${snapshot.docs.length} documents in ${collectionName}`);
    
    if (snapshot.docs.length === 0) {
      console.log(`   ⚠️  No documents to delete in ${collectionName}`);
      return 0;
    }
    
    // Delete in batches to avoid overwhelming Firestore
    const batchSize = 10;
    let deleted = 0;
    
    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const batch = snapshot.docs.slice(i, i + batchSize);
      const deletePromises = batch.map(doc => {
        console.log(`   Deleting ${collectionName}/${doc.id}...`);
        return deleteDoc(doc.ref);
      });
      await Promise.all(deletePromises);
      deleted += batch.length;
      console.log(`   ✅ Deleted ${deleted}/${snapshot.docs.length} ${collectionName}...`);
    }
    
    console.log(`✅ Successfully deleted ${deleted} ${collectionName}`);
    return deleted;
  } catch (error: any) {
    console.error(`❌ Error deleting ${collectionName}:`, error);
    console.error(`   Error details: ${error.message}`);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    return 0;
  }
}

async function deleteSubcollection(parentCollection: string, subcollectionName: string) {
  try {
    console.log(`\n🗑️  Deleting all ${parentCollection}/*/${subcollectionName}...`);
    const parentSnapshot = await getDocs(collection(db, parentCollection));
    let totalDeleted = 0;
    
    for (const parentDoc of parentSnapshot.docs) {
      const subSnapshot = await getDocs(collection(db, parentCollection, parentDoc.id, subcollectionName));
      const deletePromises = subSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      totalDeleted += subSnapshot.docs.length;
    }
    
    console.log(`✅ Deleted ${totalDeleted} ${subcollectionName} from ${parentCollection}`);
    return totalDeleted;
  } catch (error) {
    console.error(`❌ Error deleting ${subcollectionName}:`, error);
    return 0;
  }
}

async function deleteUserSubcollections(userId: string, subcollectionName: string) {
  try {
    const subSnapshot = await getDocs(collection(db, 'users', userId, subcollectionName));
    const deletePromises = subSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    return subSnapshot.docs.length;
  } catch (error) {
    console.error(`❌ Error deleting user ${subcollectionName}:`, error);
    return 0;
  }
}

async function cleanupAll() {
  console.log('🧹 Starting cleanup of all test data...\n');
  console.log('⚠️  WARNING: This will delete ALL data from the following collections:');
  console.log('   - events');
  console.log('   - groups');
  console.log('   - messages');
  console.log('   - marketplace');
  console.log('   - resources');
  console.log('   - posts');
  console.log('   - comments');
  console.log('   - notifications');
  console.log('\n');
  
  // Authenticate (required for Firestore rules)
  try {
    console.log('🔐 Authenticating with Firebase...');
    await signInAnonymously(auth);
    console.log('✅ Authenticated successfully!\n');
  } catch (error: any) {
    console.error('❌ Authentication failed!');
    console.error(`   Error: ${error.message}`);
    console.error('\n   💡 SOLUTION: Delete manually from Firebase Console');
    console.error('   https://console.firebase.google.com/project/campus-connect-fd225/firestore');
    throw error;
  }
  
  // Test Firebase connection
  try {
    console.log('🔌 Testing Firebase connection...');
    const testSnapshot = await getDocs(collection(db, 'events'));
    console.log(`✅ Connected to Firebase! Found ${testSnapshot.docs.length} events in database.\n`);
  } catch (error: any) {
    console.error('❌ Failed to connect to Firebase!');
    console.error(`   Error: ${error.message}`);
    if (error.code === 'permission-denied') {
      console.error('\n   ⚠️  PERMISSION DENIED!');
      console.error('   Your Firestore rules may be blocking access.');
      console.error('\n   💡 SOLUTION: Delete manually from Firebase Console');
      console.error('   https://console.firebase.google.com/project/campus-connect-fd225/firestore');
    }
    throw error;
  }

  let totalDeleted = 0;

  // Delete main collections
  totalDeleted += await deleteCollection('events');
  totalDeleted += await deleteCollection('groups');
  totalDeleted += await deleteCollection('messages');
  totalDeleted += await deleteCollection('marketplace');
  totalDeleted += await deleteCollection('resources');
  totalDeleted += await deleteCollection('posts');

  // Delete subcollections
  totalDeleted += await deleteSubcollection('events', 'attendees');
  totalDeleted += await deleteSubcollection('groups', 'members');
  totalDeleted += await deleteSubcollection('groups', 'posts');
  totalDeleted += await deleteSubcollection('groups', 'joinRequests');
  totalDeleted += await deleteSubcollection('posts', 'comments');
  totalDeleted += await deleteSubcollection('posts', 'likes');

  // Delete user subcollections (notifications)
  try {
    console.log(`\n🗑️  Deleting all user notifications...`);
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let notificationsDeleted = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      notificationsDeleted += await deleteUserSubcollections(userDoc.id, 'notifications');
    }
    
    console.log(`✅ Deleted ${notificationsDeleted} notifications`);
    totalDeleted += notificationsDeleted;
  } catch (error) {
    console.error(`❌ Error deleting notifications:`, error);
  }

  console.log('\n✨ Cleanup complete!');
  console.log(`📊 Total documents deleted: ${totalDeleted}`);
  
  if (totalDeleted === 0) {
    console.log('\n⚠️  WARNING: No documents were deleted!');
    console.log('   Possible reasons:');
    console.log('   1. Collections are already empty');
    console.log('   2. Permission denied (check Firestore rules)');
    console.log('   3. Wrong Firebase project');
    console.log('\n   💡 Try deleting manually from Firebase Console:');
    console.log('      https://console.firebase.google.com/project/campus-connect-fd225/firestore');
  } else {
    console.log('\n✅ Your Firebase is now clean and ready for friends to test!');
  }
}

// Run cleanup
cleanupAll()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });

