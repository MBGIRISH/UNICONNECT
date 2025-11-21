/**
 * Firebase Database Initialization Script
 * Run this once to populate your Firestore with sample data
 * 
 * Usage: npx tsx initFirebase.ts
 */

import { db } from './firebaseConfig';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';

const samplePosts = [
  {
    userId: 'sample-1',
    userName: 'Sarah Johnson',
    userAvatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=4f46e5&color=fff',
    content: '📚 Just finished my final project for CS301! Three months of work finally paid off. Anyone else staying up late working on finals? ☕️',
    image: 'https://picsum.photos/seed/study1/800/400',
    likes: 24,
    comments: 5,
    createdAt: serverTimestamp()
  },
  {
    userId: 'sample-2',
    userName: 'Alex Martinez',
    userAvatar: 'https://ui-avatars.com/api/?name=Alex+Martinez&background=0ea5e9&color=fff',
    content: 'Excited to announce that our robotics team won first place at the regional competition! 🤖🏆 Thanks to everyone who supported us!',
    image: 'https://picsum.photos/seed/robot/800/400',
    likes: 156,
    comments: 23,
    createdAt: serverTimestamp()
  },
  {
    userId: 'sample-3',
    userName: 'Emily Chen',
    userAvatar: 'https://ui-avatars.com/api/?name=Emily+Chen&background=f59e0b&color=fff',
    content: 'Free tutoring sessions for Calculus II every Tuesday and Thursday, 3-5 PM at the library! DM me if you want to join. Let\'s ace those exams together! 📐',
    likes: 42,
    comments: 12,
    createdAt: serverTimestamp()
  }
];

const sampleEvents = [
  {
    title: 'Campus Tech Hackathon 2024',
    date: 'DEC 15',
    time: '9:00 AM - 9:00 PM',
    location: 'Engineering Building, Hall A',
    organizer: 'CS Society',
    category: 'Academic',
    attendees: 142,
    image: 'https://picsum.photos/seed/hackathon/800/400'
  },
  {
    title: 'Winter Career Fair',
    date: 'DEC 08',
    time: '10:00 AM - 4:00 PM',
    location: 'Student Union Center',
    organizer: 'Career Services',
    category: 'Career',
    attendees: 320,
    image: 'https://picsum.photos/seed/career/800/400'
  },
  {
    title: 'Holiday Gala Night',
    date: 'DEC 20',
    time: '7:00 PM',
    location: 'Grand Ballroom',
    organizer: 'Student Council',
    category: 'Social',
    attendees: 250,
    image: 'https://picsum.photos/seed/gala/800/400'
  },
  {
    title: 'Basketball Championship Finals',
    date: 'DEC 10',
    time: '6:00 PM',
    location: 'Main Arena',
    organizer: 'Athletics Department',
    category: 'Sports',
    attendees: 500,
    image: 'https://picsum.photos/seed/basketball/800/400'
  }
];

const sampleMarketItems = [
  {
    title: 'Calculus: Early Transcendentals (8th Ed)',
    price: 45,
    description: 'Excellent condition, used for one semester. All pages intact, minimal highlighting.',
    seller: 'John Davis',
    sellerId: 'sample-1',
    image: 'https://picsum.photos/seed/calcbook/400/400',
    condition: 'Good',
    createdAt: serverTimestamp()
  },
  {
    title: 'MacBook Air M1 2020',
    price: 650,
    description: '8GB RAM, 256GB SSD. Battery health 92%. Perfect for students!',
    seller: 'Maria Garcia',
    sellerId: 'sample-2',
    image: 'https://picsum.photos/seed/macbook/400/400',
    condition: 'Like New',
    createdAt: serverTimestamp()
  },
  {
    title: 'Mini Fridge (4.5 cu ft)',
    price: 80,
    description: 'Perfect for dorm rooms. Used for 1 year, works perfectly.',
    seller: 'Mike Wilson',
    sellerId: 'sample-3',
    image: 'https://picsum.photos/seed/fridge/400/400',
    condition: 'Good',
    createdAt: serverTimestamp()
  },
  {
    title: 'TI-84 Plus Calculator',
    price: 60,
    description: 'Required for math courses. Barely used.',
    seller: 'Lisa Anderson',
    sellerId: 'sample-4',
    image: 'https://picsum.photos/seed/calculator/400/400',
    condition: 'Like New',
    createdAt: serverTimestamp()
  },
  {
    title: 'Desk Lamp with USB Ports',
    price: 25,
    description: 'LED desk lamp with adjustable brightness and 2 USB charging ports.',
    seller: 'Tom Brown',
    sellerId: 'sample-5',
    image: 'https://picsum.photos/seed/lamp/400/400',
    condition: 'New',
    createdAt: serverTimestamp()
  }
];

async function initializeDatabase() {
  if (!db) {
    console.error('❌ Firebase not initialized. Check your firebaseConfig.ts');
    process.exit(1);
  }

  console.log('🔧 Initializing Firebase Database...\n');

  try {
    // Check if posts already exist
    const postsSnapshot = await getDocs(collection(db, 'posts'));
    if (postsSnapshot.empty) {
      console.log('📝 Adding sample posts...');
      for (const post of samplePosts) {
        await addDoc(collection(db, 'posts'), post);
      }
      console.log(`✅ Added ${samplePosts.length} sample posts`);
    } else {
      console.log('ℹ️  Posts collection already has data. Skipping...');
    }

    // Check if events already exist
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    if (eventsSnapshot.empty) {
      console.log('📅 Adding sample events...');
      for (const event of sampleEvents) {
        await addDoc(collection(db, 'events'), event);
      }
      console.log(`✅ Added ${sampleEvents.length} sample events`);
    } else {
      console.log('ℹ️  Events collection already has data. Skipping...');
    }

    // Check if market items already exist
    const marketSnapshot = await getDocs(collection(db, 'market'));
    if (marketSnapshot.empty) {
      console.log('🛒 Adding sample marketplace items...');
      for (const item of sampleMarketItems) {
        await addDoc(collection(db, 'market'), item);
      }
      console.log(`✅ Added ${sampleMarketItems.length} sample marketplace items`);
    } else {
      console.log('ℹ️  Marketplace collection already has data. Skipping...');
    }

    console.log('\n✨ Database initialization complete!');
    console.log('\n📋 Collections created:');
    console.log('   - posts (social feed)');
    console.log('   - events (campus events)');
    console.log('   - market (marketplace items)');
    console.log('   - groups/{groupId}/messages (study group chats - created on first message)');
    
    console.log('\n🚀 You can now run: npm run dev');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();

