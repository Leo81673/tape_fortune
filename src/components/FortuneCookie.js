import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFortuneMessage } from '../data/fortuneMessages';
import TAROT_CARDS from '../data/tarotCards';
import { openFortuneForToday, saveCoupon, getUserCoupons, cleanExpiredCoupons } from '../services/firestoreService';
import { generateDailyHoroscope } from '../utils/horoscope';

export default function FortuneCookie({
  userId, userProfile, checkinData, onFortuneOpened,
  adminConfig
}) {
  const isTester = userId?.toLowerCase().startsWith('tester');

  const [phase, setPhase] = useState(
    (checkinData?.fortune_opened && !isTester) ? 'result' : 'closed'
  );
  const [fortuneResult, setFortuneResult] = useState(
    (checkinData?.fortune_opened && !isTester)
      ? {
          message: checkinData.fortune_message,
          coupon: checkinData.coupon_won,
          cardId: checkinData.collected_item,
          horoscope: checkinData.horoscope || null
        }
      : null
  );
  const [collectionCoupon, setCollectionCoupon] = useState(null);
  const [activeCoupons, setActiveCoupons] = useState([]);

  // Load active coupons on mount (persisted across refresh)
  useEffect(() => {
    if (userId) {
      loadActiveCoupons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadActiveCoupons = useCallback(async () => {
    try {
      await cleanExpiredCoupons(userId);
      const coupons = await getUserCoupons(userId);
      setActiveCoupons(coupons);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    }
  }, [userId]);

  // Coupon timer
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fortune coupons configuration from admin
  const fortuneCoupons = useMemo(() => {
    return adminConfig?.fortune_coupons || [
      { id: 'coupon_1', name: '샷 쿠폰', probability: 0.03, text: '무료 샷 1잔 제공!' },
      { id: 'coupon_2', name: '할인 쿠폰', probability: 0.03, text: '음료 20% 할인!' },
      { id: 'coupon_3', name: '디저트 쿠폰', probability: 0.01, text: '디저트 1개 무료!' }
    ];
  }, [adminConfig]);

  const couponTimerMinutes = adminConfig?.coupon_timer_minutes || 30;

  // Card settings from admin (per-card probability)
  const cardSettings = useMemo(() => {
    return adminConfig?.card_settings || {};
  }, [adminConfig]);

  const getWeightedRandomCard = () => {
    // Build weighted list based on admin-configured probabilities
    const weights = TAROT_CARDS.map(card => {
      const setting = cardSettings[card.id];
      return setting?.probability ?? (100 / 22); // default equal distribution
    });
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let roll = Math.random() * totalWeight;

    for (let i = 0; i < TAROT_CARDS.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return TAROT_CARDS[i];
    }
    return TAROT_CARDS[TAROT_CARDS.length - 1];
  };

  const rollFortuneCoupon = () => {
    const roll = Math.random();
    let cumulative = 0;
    for (const coupon of fortuneCoupons) {
      cumulative += coupon.probability;
      if (roll < cumulative) {
        return coupon;
      }
    }
    return null;
  };

  const openCookie = async () => {
    if (phase !== 'closed') return;
    if (checkinData?.fortune_opened && !isTester) return;

    setPhase('cracking');

    // Generate fortune
    const ohaeng = userProfile?.ilju?.ohaeng?.cheongan || null;
    const message = getFortuneMessage(ohaeng);
    const card = getWeightedRandomCard();

    // Coupon roll using admin-configured coupons
    const wonCoupon = rollFortuneCoupon();
    const couponData = wonCoupon ? {
      id: wonCoupon.id,
      name: wonCoupon.name,
      text: wonCoupon.text
    } : null;

    // Generate horoscope if user has birthday
    const horoscope = generateDailyHoroscope(userProfile);

    const result = { message, coupon: couponData, cardId: card.id, horoscope };
    setFortuneResult(result);

    // Save to Firestore
    try {
      const saveResult = await openFortuneForToday(userId, result);
      if (!saveResult.opened) {
        if (saveResult.existing) {
          setFortuneResult(saveResult.existing);
          setPhase('result');
          if (onFortuneOpened) onFortuneOpened(saveResult.existing);
          return;
        }
        setPhase('closed');
        return;
      }

      // Handle first-time card → collection coupon
      if (saveResult.isFirstTimeCard) {
        const cardSetting = cardSettings[card.id];
        const collCouponText = cardSetting?.coupon_text || `${card.nameKr} 카드 첫 획득 보너스!`;
        const collCouponData = {
          type: 'collection',
          card_id: card.id,
          card_name: card.nameKr,
          text: collCouponText,
          instagram_id: userId,
          expires_at: Date.now() + couponTimerMinutes * 60 * 1000,
          created_at: Date.now()
        };
        setCollectionCoupon(collCouponData);
        await saveCoupon(userId, collCouponData);
      }

      // Save fortune coupon if won
      if (couponData) {
        const fortuneCouponRecord = {
          type: 'fortune',
          coupon_id: couponData.id,
          name: couponData.name,
          text: couponData.text,
          instagram_id: userId,
          expires_at: Date.now() + couponTimerMinutes * 60 * 1000,
          created_at: Date.now()
        };
        await saveCoupon(userId, fortuneCouponRecord);
        await loadActiveCoupons();
      }
    } catch (err) {
      console.error('Failed to save fortune result:', err);
      setPhase('closed');
      return;
    }

    // Show cracking animation then reveal
    setTimeout(() => {
      setPhase('result');
      if (onFortuneOpened) onFortuneOpened(result);
      loadActiveCoupons();
    }, 1500);
  };

  const formatTimer = (ms) => {
    if (ms <= 0) return '만료됨';
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const tarotCard = fortuneResult
    ? TAROT_CARDS.find(c => c.id === fortuneResult.cardId)
    : null;

  const horoscope = fortuneResult?.horoscope;

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <AnimatePresence mode="wait">
        {phase === 'closed' && (
          <motion.div
            key="closed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <p className="text-dim text-sm mb-16">
              포춘쿠키를 터치하여 오늘의 운세를 확인하세요
            </p>
            <motion.button
              onClick={openCookie}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 100,
                lineHeight: 1,
                filter: 'drop-shadow(0 0 20px rgba(212, 168, 67, 0.3))'
              }}
            >
              🥠
            </motion.button>
            <p className="text-muted text-xs mt-16">탭하여 열기</p>
            {isTester && (
              <p className="text-xs mt-8" style={{ color: 'var(--color-gold-dark)' }}>
                테스터 모드: 무제한 열기 가능
              </p>
            )}
          </motion.div>
        )}

        {phase === 'cracking' && (
          <motion.div
            key="cracking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.1, 1.1, 1.1, 1.1, 1.2]
              }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              style={{ fontSize: 100, lineHeight: 1 }}
            >
              🥠
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.5, times: [0, 0.3, 0.7, 1] }}
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: 16
              }}
            >
              <span className="text-gold">✨</span>
            </motion.div>
          </motion.div>
        )}

        {phase === 'result' && fortuneResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Fortune message */}
            <div
              className="card"
              style={{
                background: 'linear-gradient(135deg, #1a1520, #14141f)',
                border: '1px solid var(--color-gold-dark)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: 'linear-gradient(90deg, transparent, var(--color-gold), transparent)'
                }}
              />
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--color-gold-dark)',
                  letterSpacing: 2,
                  marginBottom: 12,
                  textTransform: 'uppercase'
                }}
              >
                Today's Fortune
              </p>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.8,
                  color: 'var(--color-gold-light)',
                  fontWeight: 300
                }}
              >
                "{fortuneResult.message}"
              </p>
            </div>

            {/* Daily Horoscope */}
            {horoscope && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card mt-16"
                style={{
                  background: 'linear-gradient(135deg, #14141f, #1a1520)',
                  border: '1px solid var(--color-border)',
                  textAlign: 'center'
                }}
              >
                <p className="text-xs text-muted mb-8" style={{ letterSpacing: 1 }}>
                  오늘의 운세
                </p>
                <div style={{ fontSize: 28, marginBottom: 4 }}>
                  {horoscope.zodiacEmoji}
                </div>
                <p style={{ color: 'var(--color-gold)', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                  {horoscope.zodiac}
                </p>
                <p className="text-dim text-sm" style={{ lineHeight: 1.6, marginBottom: 8 }}>
                  {horoscope.message}
                </p>
                {horoscope.ohaengMessage && (
                  <p className="text-xs text-muted" style={{ lineHeight: 1.5, fontStyle: 'italic' }}>
                    {horoscope.ohaengMessage}
                  </p>
                )}
                <div style={{ marginTop: 8 }}>
                  <span className="text-xs text-muted">행운지수 </span>
                  <span style={{ color: 'var(--color-gold)', letterSpacing: 2 }}>
                    {'★'.repeat(horoscope.luckyScore)}{'☆'.repeat(5 - horoscope.luckyScore)}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Fortune Coupon */}
            {fortuneResult.coupon && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="card mt-16"
                style={{
                  background: 'linear-gradient(135deg, #2a1a0a, #1a1400)',
                  border: '1px solid var(--color-gold)',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                <p style={{ color: 'var(--color-gold)', fontWeight: 700, fontSize: 18 }}>
                  {fortuneResult.coupon.name} 당첨!
                </p>
                <p className="text-dim text-sm mt-8">
                  {fortuneResult.coupon.text}
                </p>
                <p className="text-xs text-muted mt-8">
                  @{userId}
                </p>
                <p className="text-dim text-xs mt-4">
                  바텐더에게 이 화면을 보여주세요
                </p>
              </motion.div>
            )}

            {/* Collection Coupon (first-time card) */}
            {collectionCoupon && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="card mt-16"
                style={{
                  background: 'linear-gradient(135deg, #0a1a2a, #001420)',
                  border: '1px solid #4a90d9',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>🃏</div>
                <p style={{ color: '#4a90d9', fontWeight: 700, fontSize: 16 }}>
                  새 카드 획득 쿠폰!
                </p>
                <p className="text-dim text-sm mt-8">
                  {collectionCoupon.text}
                </p>
                <p className="text-xs text-muted mt-8">
                  @{userId}
                </p>
              </motion.div>
            )}

            {/* Tarot card collected */}
            {tarotCard && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card mt-16"
                style={{ textAlign: 'center' }}
              >
                <p className="text-xs text-muted mb-8">수집 카드 획득</p>
                <div style={{ fontSize: 48, marginBottom: 8 }}>
                  {tarotCard.emoji}
                </div>
                <p style={{ color: 'var(--color-gold)', fontWeight: 700 }}>
                  {tarotCard.id}. {tarotCard.name}
                </p>
                <p className="text-dim text-sm">{tarotCard.nameKr}</p>
                <p className="text-muted text-xs mt-8">{tarotCard.meaning}</p>
              </motion.div>
            )}

            {/* Tester: open again button */}
            {isTester && (
              <button
                className="btn-secondary mt-16"
                onClick={() => {
                  setPhase('closed');
                  setFortuneResult(null);
                  setCollectionCoupon(null);
                }}
                style={{ maxWidth: 200, margin: '16px auto 0' }}
              >
                다시 열기 (테스터)
              </button>
            )}

            {!isTester && checkinData?.fortune_opened && !fortuneResult.coupon && (
              <p className="text-muted text-xs mt-16">
                오늘의 포춘은 이미 확인했습니다
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Coupons Section (persists across refresh) */}
      {activeCoupons.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <p className="text-xs text-muted mb-12" style={{ letterSpacing: 1 }}>
            보유 쿠폰
          </p>
          {activeCoupons.map((coupon, idx) => {
            const timeLeft = coupon.expires_at - now;
            if (timeLeft <= 0) return null;
            return (
              <div
                key={idx}
                className="card mb-12"
                style={{
                  background: coupon.type === 'collection'
                    ? 'linear-gradient(135deg, #0a1a2a, #001420)'
                    : 'linear-gradient(135deg, #2a1a0a, #1a1400)',
                  border: `1px solid ${coupon.type === 'collection' ? '#4a90d9' : 'var(--color-gold)'}`,
                  textAlign: 'center',
                  padding: 16
                }}
              >
                <p style={{
                  color: coupon.type === 'collection' ? '#4a90d9' : 'var(--color-gold)',
                  fontWeight: 700,
                  fontSize: 14
                }}>
                  {coupon.name || coupon.card_name || '쿠폰'}
                </p>
                <p className="text-dim text-xs mt-4">{coupon.text}</p>
                <p className="text-xs mt-4" style={{ color: 'var(--color-text-muted)' }}>
                  @{coupon.instagram_id}
                </p>
                <p className="text-xs mt-4" style={{
                  color: timeLeft < 300000 ? 'var(--color-error)' : 'var(--color-gold-light)',
                  fontWeight: 700
                }}>
                  남은 시간: {formatTimer(timeLeft)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
