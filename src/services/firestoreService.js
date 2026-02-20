import {
  doc, getDoc, setDoc, updateDoc, collection, getDocs,
  serverTimestamp, query, deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { getCycleDateKey, generateStaffCode } from '../utils/dateUtils';

// ==================== User Operations ====================

export async function getUser(instagramId) {
  const userDoc = await getDoc(doc(db, 'users', instagramId));
  if (userDoc.exists()) {
    return { id: instagramId, ...userDoc.data() };
  }
  return null;
}

export async function createUser(instagramId, password) {
  await setDoc(doc(db, 'users', instagramId), {
    password,
    mbti: null,
    birthday: null,
    calendar_type: null,
    ilju: null,
    collection: [],
    created_at: serverTimestamp()
  });
}

export async function updateUserProfile(instagramId, data) {
  await updateDoc(doc(db, 'users', instagramId), data);
}

export async function addToCollection(instagramId, cardId) {
  const user = await getUser(instagramId);
  if (!user) return;
  const currentCollection = user.collection || [];
  if (!currentCollection.includes(cardId)) {
    currentCollection.push(cardId);
  }
  await updateDoc(doc(db, 'users', instagramId), {
    collection: currentCollection
  });
}

// ==================== Daily Check-in Operations ====================

export async function checkIn(instagramId) {
  const dateKey = getCycleDateKey();
  await setDoc(doc(db, 'daily_checkins', dateKey, 'users', instagramId), {
    checked_in_at: serverTimestamp(),
    fortune_opened: false,
    fortune_message: null,
    coupon_won: null,
    collected_item: null,
    matched_with: null
  });
}

export async function getCheckinStatus(instagramId) {
  const dateKey = getCycleDateKey();
  const checkinDoc = await getDoc(
    doc(db, 'daily_checkins', dateKey, 'users', instagramId)
  );
  if (checkinDoc.exists()) {
    return checkinDoc.data();
  }
  return null;
}

export async function updateCheckin(instagramId, data) {
  const dateKey = getCycleDateKey();
  await updateDoc(
    doc(db, 'daily_checkins', dateKey, 'users', instagramId),
    data
  );
}

export async function getTodayCheckedInUsers() {
  const dateKey = getCycleDateKey();
  const usersRef = collection(db, 'daily_checkins', dateKey, 'users');
  const snapshot = await getDocs(query(usersRef));
  const users = [];
  snapshot.forEach(doc => {
    users.push({ id: doc.id, ...doc.data() });
  });
  return users;
}

// ==================== Admin Operations ====================

export async function getAdminConfig() {
  const configDoc = await getDoc(doc(db, 'admin', 'config'));
  if (configDoc.exists()) {
    return configDoc.data();
  }
  // Initialize default config if it doesn't exist
  const defaultConfig = {
    admin_password: '0000',
    daily_staff_code: generateStaffCode(),
    coupon_probability: 0.07,
    location_lat: 37.5340,
    location_lng: 126.9948,
    location_radius: 100,
    last_code_update: serverTimestamp()
  };
  await setDoc(doc(db, 'admin', 'config'), defaultConfig);
  return defaultConfig;
}

export async function updateAdminConfig(data) {
  await updateDoc(doc(db, 'admin', 'config'), data);
}

export async function resetDaily() {
  const dateKey = getCycleDateKey();
  const usersRef = collection(db, 'daily_checkins', dateKey, 'users');
  const snapshot = await getDocs(query(usersRef));
  const deletePromises = [];
  snapshot.forEach(docSnapshot => {
    deletePromises.push(deleteDoc(docSnapshot.ref));
  });
  await Promise.all(deletePromises);

  // Generate new staff code
  await updateAdminConfig({
    daily_staff_code: generateStaffCode(),
    last_code_update: serverTimestamp()
  });
}
