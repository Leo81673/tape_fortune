import React, { useState, useEffect, useCallback } from 'react';
import LocationGate from './components/LocationGate';
import CheckIn from './components/CheckIn';
import AdminPanel from './components/AdminPanel';
import Home from './pages/Home';
import { getAdminConfig, getUser, getCheckinStatus } from './services/firestoreService';
import './styles/global.css';

function App() {
  const [appState, setAppState] = useState('loading');
  const [adminConfig, setAdminConfig] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [checkinData, setCheckinData] = useState(null);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [logoTapTimer, setLogoTapTimer] = useState(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [isAdminTestMode, setIsAdminTestMode] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await getAdminConfig();
      setAdminConfig(config);
      setAppState('location');
    } catch (err) {
      console.error('Failed to load config:', err);
      setAdminConfig({
        daily_staff_code: '0000',
        coupon_probability: 0.07,
        location_lat: 37.5340,
        location_lng: 126.9948,
        location_radius: 100,
        location_check_enabled: true,
        admin_password: '0000'
      });
      setAppState('location');
    }
  };

  const handleLocationVerified = () => {
    setAppState('checkin');
  };

  const handleCheckInComplete = useCallback(async (id) => {
    setUserId(id);
    try {
      const [profile, checkin] = await Promise.all([
        getUser(id),
        getCheckinStatus(id)
      ]);
      setUserProfile(profile);
      setCheckinData(checkin);
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
    setAppState('home');
  }, []);

  const handleProfileUpdated = (profileData) => {
    setUserProfile(prev => ({ ...prev, ...profileData }));
  };

  const handleFortuneOpened = (result) => {
    setCheckinData(prev => ({
      ...(prev || {}),
      fortune_opened: true,
      fortune_message: result.message,
      coupon_won: result.coupon,
      collected_item: result.cardId,
      horoscope: result.horoscope || null
    }));

    setUserProfile(prev => {
      if (!prev) return prev;
      const currentCollection = prev.collection || [];
      const currentCounts = prev.collection_counts || {};
      const cardId = result.cardId;
      const newCount = Math.min((currentCounts[cardId] || 0) + 1, 10);
      return {
        ...prev,
        collection: currentCollection.includes(cardId)
          ? currentCollection
          : [...currentCollection, cardId],
        collection_counts: { ...currentCounts, [cardId]: newCount }
      };
    });
  };

  const handleLogoTap = () => {
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);

    if (logoTapTimer) clearTimeout(logoTapTimer);

    if (newCount >= 5) {
      setLogoTapCount(0);
      setShowAdminPrompt(true);
      return;
    }

    const timer = setTimeout(() => setLogoTapCount(0), 2000);
    setLogoTapTimer(timer);
  };

  const handleAdminLogin = () => {
    if (adminPasswordInput === (adminConfig?.admin_password || '0000')) {
      setShowAdminPrompt(false);
      setAdminPasswordInput('');
      setIsAdminTestMode(true);
      setAppState('admin');
    } else {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  if (showAdminPrompt) {
    return (
      <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: 300 }}>
          <h3 style={{ color: 'var(--color-gold)', fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
            관리자 인증
          </h3>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="input-field"
            placeholder="관리자 비밀번호"
            value={adminPasswordInput}
            onChange={(e) => setAdminPasswordInput(e.target.value)}
            autoFocus
            style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdminLogin();
            }}
          />
          <button className="btn-primary mt-16" onClick={handleAdminLogin}>
            확인
          </button>
          <button
            className="btn-secondary mt-12"
            onClick={() => {
              setShowAdminPrompt(false);
              setAdminPasswordInput('');
            }}
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  if (appState === 'loading') {
    return (
      <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="text-center">
          <div className="logo" onClick={handleLogoTap}>TAPE</div>
          <div className="subtitle">SEOUL · ITAEWON</div>
          <p className="text-dim text-sm mt-24">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (appState === 'location') {
    return (
      <>
        <div
          className="logo"
          onClick={handleLogoTap}
          style={{ position: 'absolute', top: 20, left: 0, right: 0, zIndex: 10 }}
        >
          TAPE
        </div>
        <LocationGate
          onLocationVerified={handleLocationVerified}
          config={adminConfig}
          bypassLocationCheck={isAdminTestMode}
        />
      </>
    );
  }

  if (appState === 'checkin') {
    return (
      <CheckIn
        onCheckInComplete={handleCheckInComplete}
        staffCode={adminConfig?.daily_staff_code}
        onLogoTap={handleLogoTap}
      />
    );
  }

  if (appState === 'admin') {
    return <AdminPanel onClose={() => setAppState(userId ? 'home' : 'location')} />;
  }

  if (appState === 'home') {
    return (
      <Home
        userId={userId}
        userProfile={userProfile}
        checkinData={checkinData}
        onProfileUpdated={handleProfileUpdated}
        onFortuneOpened={handleFortuneOpened}
        adminConfig={adminConfig}
        onLogoTap={handleLogoTap}
      />
    );
  }

  return null;
}

export default App;
