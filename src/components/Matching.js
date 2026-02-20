import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllUsers, updateCheckin } from '../services/firestoreService';
import { getMbtiCompatibility } from '../utils/mbtiCompatibility';
import { calculateIljuCompatibility } from '../utils/ilju';

export default function Matching({ userId, userProfile }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noMatch, setNoMatch] = useState(false);

  useEffect(() => {
    findMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findMatch = async () => {
    setLoading(true);
    setNoMatch(false);
    try {
      if (!userProfile?.mbti || !userProfile?.ilju) {
        setNoMatch(true);
        setLoading(false);
        return;
      }

      const allUsers = await getAllUsers();
      const otherUsers = allUsers.filter(u => u.id !== userId);

      if (otherUsers.length === 0) {
        setNoMatch(true);
        setLoading(false);
        return;
      }

      let bestMatch = null;
      let bestScore = -1;

      for (const otherProfile of otherUsers) {
        if (!otherProfile?.mbti || !otherProfile?.ilju) continue;

        const mbtiScore = getMbtiCompatibility(userProfile.mbti, otherProfile.mbti);
        const iljuScore = calculateIljuCompatibility(userProfile.ilju, otherProfile.ilju);
        const totalScore = Math.round(mbtiScore * 0.5 + iljuScore * 0.5);

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestMatch = {
            instagramId: otherProfile.id,
            mbti: otherProfile.mbti,
            score: totalScore,
            mbtiScore,
            iljuScore
          };
        }
      }

      if (bestMatch) {
        setMatch(bestMatch);
        await updateCheckin(userId, { matched_with: bestMatch.instagramId });
      } else {
        setNoMatch(true);
      }
    } catch (err) {
      console.error('Matching error:', err);
      setNoMatch(true);
    }
    setLoading(false);
  };

  const getCompatibilityComment = (score) => {
    if (score >= 90) return '운명적인 만남! 꼭 대화를 나눠보세요.';
    if (score >= 80) return '아주 좋은 궁합이에요. 분명 통하는 게 있을 거예요.';
    if (score >= 70) return '서로의 에너지가 잘 맞아요. 편안한 대화가 될 거예요.';
    if (score >= 60) return '좋은 밸런스를 이루는 조합이에요.';
    if (score >= 50) return '서로 다른 매력이 끌릴 수 있는 관계예요.';
    return '새로운 시각을 열어줄 수 있는 만남이에요.';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#ff6b6b';
    if (score >= 60) return 'var(--color-gold)';
    return 'var(--color-text-dim)';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 40, display: 'inline-block' }}
        >
          🔮
        </motion.div>
        <p className="text-dim text-sm mt-16">인연을 찾고 있습니다...</p>
      </div>
    );
  }

  if (!userProfile?.mbti || !userProfile?.ilju) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📝</div>
        <p className="text-dim text-sm">
          매칭을 위해 먼저 MBTI와 생년월일을<br />입력해주세요.
        </p>
      </div>
    );
  }

  if (noMatch) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🌙</div>
        <p style={{ color: 'var(--color-gold)', fontWeight: 500, marginBottom: 8 }}>
          아직 오늘의 인연이 도착하지 않았어요
        </p>
        <p className="text-dim text-sm">
          잠시 후 다시 확인해보세요.
        </p>
        <button
          className="btn-secondary mt-24"
          onClick={findMatch}
          style={{ maxWidth: 200, margin: '24px auto 0' }}
        >
          다시 확인
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '20px 0' }}
    >
      <div className="text-center mb-16">
        <p className="text-xs text-muted" style={{ letterSpacing: 2 }}>
          TODAY'S MATCH
        </p>
      </div>

      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1a1520, #14141f)',
          border: '1px solid var(--color-gold-dark)',
          textAlign: 'center',
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

        <div style={{ marginBottom: 20 }}>
          <span
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: getScoreColor(match.score),
              lineHeight: 1
            }}
          >
            {match.score}
          </span>
          <span className="text-dim text-sm">점</span>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <p className="text-xs text-muted mb-8">MBTI</p>
            <div style={{
              height: 4,
              background: 'var(--color-bg)',
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${match.mbtiScore}%` }}
                transition={{ delay: 0.3, duration: 0.8 }}
                style={{
                  height: '100%',
                  background: 'var(--color-gold)',
                  borderRadius: 2
                }}
              />
            </div>
            <p className="text-xs text-muted mt-8">{match.mbtiScore}점</p>
          </div>
          <div style={{ flex: 1 }}>
            <p className="text-xs text-muted mb-8">사주</p>
            <div style={{
              height: 4,
              background: 'var(--color-bg)',
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${match.iljuScore}%` }}
                transition={{ delay: 0.5, duration: 0.8 }}
                style={{
                  height: '100%',
                  background: 'var(--color-gold)',
                  borderRadius: 2
                }}
              />
            </div>
            <p className="text-xs text-muted mt-8">{match.iljuScore}점</p>
          </div>
        </div>

        <div style={{
          padding: '16px',
          background: 'rgba(212, 168, 67, 0.08)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 16
        }}>
          <p className="text-xs text-muted mb-8">상대방 인스타그램</p>
          <p style={{ color: 'var(--color-gold)', fontWeight: 700, fontSize: 18 }}>
            @{match.instagramId}
          </p>
        </div>

        <p className="text-dim text-sm" style={{ lineHeight: 1.6, fontStyle: 'italic' }}>
          "{getCompatibilityComment(match.score)}"
        </p>
      </div>

      <button
        className="btn-secondary mt-16"
        onClick={findMatch}
        style={{ maxWidth: 200, margin: '16px auto 0', display: 'block' }}
      >
        새로고침
      </button>
    </motion.div>
  );
}
