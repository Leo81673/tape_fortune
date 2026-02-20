import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFortuneMessage } from '../data/fortuneMessages';
import { getRandomTarotCard } from '../data/tarotCards';
import TAROT_CARDS from '../data/tarotCards';
import { openFortuneForToday } from '../services/firestoreService';

export default function FortuneCookie({ userId, userProfile, checkinData, onFortuneOpened, couponProbability }) {
  const [phase, setPhase] = useState(
    checkinData?.fortune_opened ? 'result' : 'closed'
  ); // closed, cracking, result
  const [fortuneResult, setFortuneResult] = useState(
    checkinData?.fortune_opened
      ? {
          message: checkinData.fortune_message,
          coupon: checkinData.coupon_won,
          cardId: checkinData.collected_item
        }
      : null
  );

  const couponExpireAt = useMemo(() => {
    if (phase !== 'result' || !fortuneResult?.coupon) return null;
    return Date.now() + 10 * 60 * 1000;
  }, [phase, fortuneResult]);

  const [couponTimeLeft, setCouponTimeLeft] = useState(null);

  useEffect(() => {
    if (!couponExpireAt || !fortuneResult?.coupon) {
      setCouponTimeLeft(null);
      return undefined;
    }

    const tick = () => {
      const left = Math.max(0, couponExpireAt - Date.now());
      setCouponTimeLeft(left);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [couponExpireAt, fortuneResult]);

  const openCookie = async () => {
    if (phase !== 'closed' || checkinData?.fortune_opened) {
      return;
    }

    setPhase('cracking');

    // Generate fortune
    const ohaeng = userProfile?.ilju?.ohaeng?.cheongan || null;
    const message = getFortuneMessage(ohaeng);
    const card = getRandomTarotCard();

    // Coupon roll
    const prob = couponProbability || 0.07;
    const couponRoll = Math.random();
    let coupon = null;
    if (couponRoll < prob) {
      coupon = couponRoll < prob / 2 ? 'shot_coupon' : 'discount_coupon';
    }

    const result = { message, coupon, cardId: card.id };
    setFortuneResult(result);

    // Save to Firestore atomically (one open per cycle)
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
    } catch (err) {
      console.error('Failed to save fortune result:', err);
      setPhase('closed');
      return;
    }

    // Show cracking animation then reveal
    setTimeout(() => {
      setPhase('result');
      if (onFortuneOpened) onFortuneOpened(result);
    }, 1500);
  };

  const formatTimer = (ms) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const couponLabel = (coupon) => {
    switch (coupon) {
      case 'shot_coupon': return '샷 쿠폰 당첨!';
      case 'discount_coupon': return '할인 쿠폰 당첨!';
      default: return null;
    }
  };

  const tarotCard = fortuneResult
    ? TAROT_CARDS.find(c => c.id === fortuneResult.cardId)
    : null;

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

            {/* Coupon */}
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
                  {couponLabel(fortuneResult.coupon)}
                </p>
                <p className="text-dim text-xs mt-8">
                  바텐더에게 이 화면을 보여주세요
                </p>
                {fortuneResult.coupon === 'discount_coupon' && couponTimeLeft !== null && (
                  <p className="text-xs mt-8" style={{ color: 'var(--color-gold-light)', fontWeight: 700 }}>
                    쿠폰 유효시간 {formatTimer(couponTimeLeft)}
                  </p>
                )}
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

            {checkinData?.fortune_opened && !fortuneResult.coupon && (
              <p className="text-muted text-xs mt-16">
                오늘의 포춘은 이미 확인했습니다
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
