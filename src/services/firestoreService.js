import {
  doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc,
  serverTimestamp, query, deleteDoc, runTransaction, arrayUnion
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
    collection_counts: {},
    coupons: [],
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
  const checkinRef = doc(db, 'daily_checkins', dateKey, 'users', instagramId);
  const existingCheckin = await getDoc(checkinRef);

  if (existingCheckin.exists()) {
    return existingCheckin.data();
  }

  await setDoc(checkinRef, {
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

export async function openFortuneForToday(instagramId, fortuneData) {
  const dateKey = getCycleDateKey();
  const checkinRef = doc(db, 'daily_checkins', dateKey, 'users', instagramId);
  const userRef = doc(db, 'users', instagramId);

  return runTransaction(db, async (transaction) => {
    const checkinSnap = await transaction.get(checkinRef);
    const userSnap = await transaction.get(userRef);
    const isTester = instagramId.toLowerCase() === 'tester';

    if (!checkinSnap.exists() && !isTester) {
      return { opened: false, reason: 'not_checked_in' };
    }

    const currentCheckin = checkinSnap.exists()
      ? checkinSnap.data()
      : {
          fortune_opened: false,
          fortune_message: null,
          coupon_won: null,
          collected_item: null,
          matched_with: null
        };
    if (currentCheckin.fortune_opened && !isTester) {
      return {
        opened: false,
        reason: 'already_opened',
        existing: {
          message: currentCheckin.fortune_message,
          coupon: currentCheckin.coupon_won,
          cardId: currentCheckin.collected_item,
          horoscope: currentCheckin.horoscope || null
        }
      };
    }

    const updateData = {
      fortune_opened: true,
      fortune_message: fortuneData.message,
      coupon_won: fortuneData.coupon,
      collected_item: fortuneData.cardId,
    };

    if (fortuneData.horoscope) {
      updateData.horoscope = fortuneData.horoscope;
    }

    // Update collection: add card and increment count
    const userData = userSnap.data() || {};
    const collectionCounts = userData.collection_counts || {};
    const currentCount = collectionCounts[fortuneData.cardId] || 0;
    const newCount = Math.min(currentCount + 1, 10);

    if (checkinSnap.exists()) {
      transaction.update(checkinRef, updateData);
    } else {
      transaction.set(checkinRef, {
        checked_in_at: serverTimestamp(),
        matched_with: null,
        ...updateData
      });
    }

    transaction.update(userRef, {
      collection: arrayUnion(fortuneData.cardId),
      [`collection_counts.${fortuneData.cardId}`]: newCount
    });

    // Check if this is first-time card acquisition
    const isFirstTime = !userData.collection || !userData.collection.includes(fortuneData.cardId);

    return { opened: true, isFirstTimeCard: isFirstTime };
  });
}

/**
 * Save a coupon to user's persistent coupon list.
 */
export async function saveCoupon(instagramId, coupon) {
  const userRef = doc(db, 'users', instagramId);
  await updateDoc(userRef, {
    coupons: arrayUnion(coupon)
  });
}

/**
 * Get user's active (non-expired) coupons.
 */
export async function getUserCoupons(instagramId) {
  const user = await getUser(instagramId);
  if (!user || !user.coupons) return [];
  const now = Date.now();
  return user.coupons.filter(c => c.expires_at > now);
}

/**
 * Clean up expired coupons for a user.
 */
export async function cleanExpiredCoupons(instagramId) {
  const user = await getUser(instagramId);
  if (!user || !user.coupons) return;
  const now = Date.now();
  const activeCoupons = user.coupons.filter(c => c.expires_at > now);
  await updateDoc(doc(db, 'users', instagramId), { coupons: activeCoupons });
}

export async function markCouponAsUsed(instagramId, targetCoupon) {
  const user = await getUser(instagramId);
  if (!user || !user.coupons) return;

  const coupons = user.coupons.map((coupon) => {
    const isSameCoupon = (
      coupon.created_at === targetCoupon.created_at &&
      coupon.type === targetCoupon.type &&
      (coupon.coupon_id || coupon.card_id || coupon.text) === (targetCoupon.coupon_id || targetCoupon.card_id || targetCoupon.text)
    );

    if (!isSameCoupon || coupon.used_at) {
      return coupon;
    }

    return {
      ...coupon,
      used_at: Date.now()
    };
  });

  await updateDoc(doc(db, 'users', instagramId), { coupons });
}

/**
 * Best-effort debug logging for fortune flow failures and step tracing.
 */
export async function logFortuneDebugEvent(event) {
  try {
    await addDoc(collection(db, 'fortune_debug_logs'), {
      ...event,
      created_at: serverTimestamp()
    });
  } catch (err) {
    console.error('Failed to write fortune debug log:', err);
  }
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

export async function getAllUsers() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(query(usersRef));
  const users = [];
  snapshot.forEach((docSnapshot) => {
    users.push({ id: docSnapshot.id, ...docSnapshot.data() });
  });
  return users;
}

// ==================== Admin Operations ====================

const DEFAULT_FORTUNE_COUPONS = [
  { id: 'coupon_1', name: '샷 쿠폰', probability: 0.03, text: '무료 샷 1잔 제공!' },
  { id: 'coupon_2', name: '할인 쿠폰', probability: 0.03, text: '음료 20% 할인!' },
  { id: 'coupon_3', name: '디저트 쿠폰', probability: 0.01, text: '디저트 1개 무료!' }
];

export async function getAdminConfig() {
  const configDoc = await getDoc(doc(db, 'admin', 'config'));
  if (configDoc.exists()) {
    const data = configDoc.data();
    // Ensure new fields exist with defaults
    if (!data.fortune_coupons) {
      data.fortune_coupons = DEFAULT_FORTUNE_COUPONS;
    }
    if (!data.coupon_timer_minutes) {
      data.coupon_timer_minutes = 30;
    }
    if (!data.card_settings) {
      data.card_settings = {};
    }
    return data;
  }
  // Initialize default config if it doesn't exist
  const defaultConfig = {
    admin_password: '0000',
    daily_staff_code: generateStaffCode(),
    coupon_probability: 0.07,
    location_lat: 37.5340,
    location_lng: 126.9948,
    location_radius: 100,
    location_check_enabled: true,
    last_code_update: serverTimestamp(),
    fortune_coupons: DEFAULT_FORTUNE_COUPONS,
    coupon_timer_minutes: 30,
    card_settings: {}
  };
  await setDoc(doc(db, 'admin', 'config'), defaultConfig);
  return defaultConfig;
}

export async function updateAdminConfig(data) {
  await updateDoc(doc(db, 'admin', 'config'), data);
}

export async function regenerateStaffCode() {
  await updateAdminConfig({
    daily_staff_code: generateStaffCode(),
    last_code_update: serverTimestamp()
  });
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
  await regenerateStaffCode();
}

export async function resetTesterData(instagramId) {
  const userRef = doc(db, 'users', instagramId);
  const dateKey = getCycleDateKey();
  const checkinRef = doc(db, 'daily_checkins', dateKey, 'users', instagramId);

  await Promise.all([
    updateDoc(userRef, {
      mbti: null,
      birthday: null,
      calendar_type: null,
      ilju: null,
      collection: [],
      collection_counts: {},
      coupons: []
    }),
    setDoc(checkinRef, {
      checked_in_at: serverTimestamp(),
      fortune_opened: false,
      fortune_message: null,
      coupon_won: null,
      collected_item: null,
      matched_with: null,
      horoscope: null
    }, { merge: true })
  ]);
}
