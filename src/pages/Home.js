import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FortuneCookie from '../components/FortuneCookie';
import Collection from '../components/Collection';
import MbtiProfile from '../components/MbtiProfile';
import Matching from '../components/Matching';

const TABS = [
  { id: 'fortune', label: '포춘쿠키', icon: '🥠' },
  { id: 'matching', label: '매칭', icon: '🔮' },
  { id: 'collection', label: '도감', icon: '🃏' },
  { id: 'profile', label: '프로필', icon: '📝' }
];

export default function Home({ userId, userProfile, checkinData, onProfileUpdated, onFortuneOpened, adminConfig, onLogoTap }) {
  const [activeTab, setActiveTab] = useState('fortune');
  const isTester = userId?.toLowerCase().startsWith('tester');
  const [fortuneOpened, setFortuneOpened] = useState(
    (checkinData?.fortune_opened && !isTester) || false
  );

  const handleFortuneOpened = (result) => {
    setFortuneOpened(true);
    if (onFortuneOpened) onFortuneOpened(result);
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div className="text-center" style={{ marginBottom: 8 }}>
        <p style={{
          fontSize: 14,
          color: 'var(--color-gold)',
          letterSpacing: 3,
          fontWeight: 700
        }}>
          <span onClick={onLogoTap} style={{ cursor: 'default' }}>TAPE</span>
        </p>
        <p className="text-xs text-muted">
          @{userId}
        </p>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          {activeTab === 'fortune' && (
            <motion.div
              key="fortune"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <FortuneCookie
                userId={userId}
                userProfile={userProfile}
                checkinData={checkinData}
                onFortuneOpened={handleFortuneOpened}
                adminConfig={adminConfig}
              />

              {fortuneOpened && !userProfile?.mbti && (
                <div className="card mt-16 text-center">
                  <p className="text-dim text-sm">
                    매칭을 원하시면 프로필 탭에서<br />MBTI와 생년월일을 입력해주세요.
                  </p>
                  <button
                    className="btn-secondary mt-12"
                    onClick={() => setActiveTab('profile')}
                    style={{ maxWidth: 200, margin: '12px auto 0' }}
                  >
                    프로필 입력하기
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'matching' && (
            <motion.div
              key="matching"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Matching userId={userId} userProfile={userProfile} />
            </motion.div>
          )}

          {activeTab === 'collection' && (
            <motion.div
              key="collection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Collection
                userCollection={userProfile?.collection || []}
                collectionCounts={userProfile?.collection_counts || {}}
              />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <MbtiProfile
                userId={userId}
                userProfile={userProfile}
                onProfileUpdated={onProfileUpdated}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, var(--color-bg) 80%, transparent)',
          padding: '12px 0 max(12px, env(safe-area-inset-bottom))',
          zIndex: 100
        }}
      >
        <div
          style={{
            maxWidth: 420,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '0 16px'
          }}
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === tab.id
                  ? 'rgba(212, 168, 67, 0.1)'
                  : 'transparent',
                transition: 'all 0.2s ease',
                minWidth: 60
              }}
            >
              <span style={{ fontSize: 20 }}>{tab.icon}</span>
              <span
                style={{
                  fontSize: 10,
                  color: activeTab === tab.id
                    ? 'var(--color-gold)'
                    : 'var(--color-text-muted)',
                  fontWeight: activeTab === tab.id ? 700 : 400
                }}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
