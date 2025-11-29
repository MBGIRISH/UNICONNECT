/**
 * Browser Console Migration Script
 * 
 * Copy and paste this ENTIRE script into your browser console while logged into the app.
 * Make sure you're on a page that has Firebase initialized (any page of the app).
 */

(async function migrateDataInBrowser() {
  console.log('🚀 Starting college data migration...');
  
  try {
    // Import Firebase - adjust path if needed
    const firebaseModule = await import('./firebaseConfig.ts');
    const { db, auth } = firebaseModule;
    const { 
      collection, 
      getDocs, 
      doc, 
      updateDoc, 
      getDoc
    } = await import('firebase/firestore');
    
    // Validate db is initialized
    if (!db) {
      console.error('❌ Firestore db is not initialized. Please refresh the page and try again.');
      return;
    }
    
    if (!auth.currentUser) {
      console.error('❌ Please log in first. Go to the app and log in, then run this script again.');
      return;
    }
    
    const user = auth.currentUser;
    console.log(`👤 Logged in as: ${user.displayName} (${user.uid})`);
    
    // Get user's college from profile
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      console.error('❌ User profile not found. Please complete your profile first.');
      return;
    }
    
    const userData = userDoc.data();
    const userCollege = userData.college;
    
    if (!userCollege) {
      console.error('❌ College not found in profile. Please complete your profile with college information first.');
      return;
    }
    
    console.log(`🎓 Migrating data for college: ${userCollege}`);
    console.log('⏳ This may take a few minutes...\n');
    
    let totalUpdated = 0;
    
    // Migrate Posts
    try {
      console.log('📝 Migrating posts...');
      const postsRef = collection(db, 'posts');
      const postsSnapshot = await getDocs(postsRef);
      let postsUpdated = 0;
      let postsSkipped = 0;
      
      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();
        if (!postData.college && postData.authorId === user.uid) {
          await updateDoc(doc(db, 'posts', postDoc.id), { college: userCollege });
          postsUpdated++;
        } else if (postData.college) {
          postsSkipped++;
        }
      }
      console.log(`   ✅ Updated ${postsUpdated} posts`);
      if (postsSkipped > 0) console.log(`   ⏭️  Skipped ${postsSkipped} posts (already have college)`);
      totalUpdated += postsUpdated;
    } catch (error) {
      console.error('   ❌ Error migrating posts:', error.message);
    }
    
    // Migrate Events
    try {
      console.log('📅 Migrating events...');
      const eventsRef = collection(db, 'events');
      const eventsSnapshot = await getDocs(eventsRef);
      let eventsUpdated = 0;
      let eventsSkipped = 0;
      
      for (const eventDoc of eventsSnapshot.docs) {
        const eventData = eventDoc.data();
        if (!eventData.college && 
            (eventData.organizer === user.displayName || 
             eventData.hostId === user.uid ||
             eventData.hostName === user.displayName)) {
          await updateDoc(doc(db, 'events', eventDoc.id), { college: userCollege });
          eventsUpdated++;
        } else if (eventData.college) {
          eventsSkipped++;
        }
      }
      console.log(`   ✅ Updated ${eventsUpdated} events`);
      if (eventsSkipped > 0) console.log(`   ⏭️  Skipped ${eventsSkipped} events (already have college)`);
      totalUpdated += eventsUpdated;
    } catch (error) {
      console.error('   ❌ Error migrating events:', error.message);
    }
    
    // Migrate Marketplace Items
    try {
      console.log('🛒 Migrating marketplace items...');
      const marketplaceRef = collection(db, 'marketplace');
      const marketplaceSnapshot = await getDocs(marketplaceRef);
      let marketplaceUpdated = 0;
      let marketplaceSkipped = 0;
      
      for (const itemDoc of marketplaceSnapshot.docs) {
        const itemData = itemDoc.data();
        if (!itemData.college && itemData.sellerId === user.uid) {
          await updateDoc(doc(db, 'marketplace', itemDoc.id), { college: userCollege });
          marketplaceUpdated++;
        } else if (itemData.college) {
          marketplaceSkipped++;
        }
      }
      console.log(`   ✅ Updated ${marketplaceUpdated} marketplace items`);
      if (marketplaceSkipped > 0) console.log(`   ⏭️  Skipped ${marketplaceSkipped} items (already have college)`);
      totalUpdated += marketplaceUpdated;
    } catch (error) {
      console.error('   ❌ Error migrating marketplace items:', error.message);
    }
    
    // Migrate Resources
    try {
      console.log('📚 Migrating resources...');
      const resourcesRef = collection(db, 'resources');
      const resourcesSnapshot = await getDocs(resourcesRef);
      let resourcesUpdated = 0;
      let resourcesSkipped = 0;
      
      for (const resourceDoc of resourcesSnapshot.docs) {
        const resourceData = resourceDoc.data();
        if (!resourceData.college && resourceData.uploadedBy === user.uid) {
          await updateDoc(doc(db, 'resources', resourceDoc.id), { college: userCollege });
          resourcesUpdated++;
        } else if (resourceData.college) {
          resourcesSkipped++;
        }
      }
      console.log(`   ✅ Updated ${resourcesUpdated} resources`);
      if (resourcesSkipped > 0) console.log(`   ⏭️  Skipped ${resourcesSkipped} resources (already have college)`);
      totalUpdated += resourcesUpdated;
    } catch (error) {
      console.error('   ❌ Error migrating resources:', error.message);
    }
    
    // Migrate Study Groups
    try {
      console.log('👥 Migrating study groups...');
      const groupsRef = collection(db, 'groups');
      const groupsSnapshot = await getDocs(groupsRef);
      let groupsUpdated = 0;
      let groupsSkipped = 0;
      
      for (const groupDoc of groupsSnapshot.docs) {
        const groupData = groupDoc.data();
        if (!groupData.college && groupData.creatorId === user.uid) {
          await updateDoc(doc(db, 'groups', groupDoc.id), { college: userCollege });
          groupsUpdated++;
        } else if (groupData.college) {
          groupsSkipped++;
        }
      }
      console.log(`   ✅ Updated ${groupsUpdated} study groups`);
      if (groupsSkipped > 0) console.log(`   ⏭️  Skipped ${groupsSkipped} groups (already have college)`);
      totalUpdated += groupsUpdated;
    } catch (error) {
      console.error('   ❌ Error migrating study groups:', error.message);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎉 Migration Complete!`);
    console.log(`📊 Total documents updated: ${totalUpdated}`);
    console.log(`🎓 All documents now have college: ${userCollege}`);
    console.log('='.repeat(50));
    
    if (totalUpdated === 0) {
      console.log('\n💡 Tip: If no documents were updated, they may already have the college field,');
      console.log('   or they were created by other users.');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. You are logged into the app');
    console.error('   2. You are on a page that has loaded Firebase');
    console.error('   3. Your profile has a college set');
  }
})();

