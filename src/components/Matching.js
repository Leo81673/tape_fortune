import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { getTodayCheckedInUsers, getUser } from '../services/firestoreService';
import { getMbtiCompatibility, getMbtiEvalLabel, getMbtiRelationship } from '../utils/mbtiCompatibility';
import { calculateIljuCompatibility, getSajuEvalLabel, getSajuRelationship, formatIljuDisplay, formatOhaengDisplay } from '../utils/ilju';

export default function Matching({ userId, userProfile }) {
  const [topMatches, setTopMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noMatch, setNoMatch] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const intervalRef = useRef(null);

  const findMatches = useCallback(async () => {
    try {
      if (!userProfile?.mbti || !userProfile?.ilju) {
        setNoMatch(true);
        setLoading(false);
        return;
      }

      const checkedInUsers = await getTodayCheckedInUsers();
      const checkedInIds = new Set(checkedInUsers.map(u => u.id));

      // Get full profiles for checked-in users
      const profilePromises = [...checkedInIds]
        .filter(id => id !== userId)
        .map(async (id) => {
          const profile = await getUser(id);
          return profile;
        });

      const profiles = (await Promise.all(profilePromises)).filter(p => p && p.mbti && p.ilju);

      if (profiles.length === 0) {
        setNoMatch(true);
        setTopMatches([]);
        setLoading(false);
        return;
      }

      const matches = profiles.map(otherProfile => {
        const mbtiScore = getMbtiCompatibility(userProfile.mbti, otherProfile.mbti);
        const iljuScore = calculateIljuCompatibility(userProfile.ilju, otherProfile.ilju);
        const totalScore = Math.round(mbtiScore * 0.5 + iljuScore * 0.5);

        return {
          instagramId: otherProfile.id,
          theirMbti: otherProfile.mbti,
          theirIlju: otherProfile.ilju,
          score: totalScore,
          mbtiScore,
          iljuScore
        };
      });

      matches.sort((a, b) => b.score - a.score);
      const top3 = matches.slice(0, 3);

      setTopMatches(top3);
      setNoMatch(top3.length === 0);
    } catch (err) {
      console.error('Matching error:', err);
      setNoMatch(true);
    }
    setLoading(false);
  }, [userId, userProfile]);

  useEffect(() => {
    findMatches();

    // Poll every 30 seconds for real-time updates
    intervalRef.current = setInterval(() => {
      findMatches();
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [findMatches]);

  const getScoreColor = (score) => {
    if (score >= 80) return '#ff6b6b';
    if (score >= 60) return 'var(--color-gold)';
    return 'var(--color-text-dim)';
  };

  const getRankEmoji = (idx) => {
    const emojis = ['1st', '2nd', '3rd'];
    return emojis[idx] || '';
  };

  const getRankStyle = (idx) => {
    if (idx === 0) return { color: '#FFD700', fontWeight: 700 };
    if (idx === 1) return { color: '#C0C0C0', fontWeight: 600 };
    return { color: '#CD7F32', fontWeight: 500 };
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
          잠시 후 다시 확인해보세요.<br />
          <span className="text-xs text-muted">30초마다 자동 갱신됩니다</span>
        </p>
        <button
          className="btn-secondary mt-24"
          onClick={() => { setLoading(true); findMatches(); }}
          style={{ maxWidth: 200, margin: '24px auto 0' }}
        >
          지금 확인
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <div className="text-center mb-16">
        <p className="text-xs text-muted" style={{ letterSpacing: 2 }}>
          TODAY'S TOP MATCHES
        </p>
        <p className="text-xs text-muted mt-8">
          실시간 갱신 중 (30초 간격)
        </p>
      </div>

      {topMatches.map((match, idx) => (
        <motion.div
          key={match.instagramId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.15 }}
          className="card"
          style={{
            marginBottom: 12,
            background: idx === 0
              ? 'linear-gradient(135deg, #1a1520, #14141f)'
              : 'var(--color-bg-card)',
            border: `1px solid ${idx === 0 ? 'var(--color-gold-dark)' : 'var(--color-border)'}`,
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
          onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
        >
          {idx === 0 && (
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
          )}

          {/* Header: Rank + Score + Instagram */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, ...getRankStyle(idx) }}>
                {getRankEmoji(idx)}
              </span>
              <div>
                <p style={{ color: 'var(--color-gold)', fontWeight: 700, fontSize: 16 }}>
                  @{match.instagramId}
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: getScoreColor(match.score),
                  lineHeight: 1
                }}
              >
                {match.score}
              </span>
              <span className="text-dim text-xs">점</span>
            </div>
          </div>

          {/* Score bars */}
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <p className="text-xs text-muted mb-8">MBTI {match.mbtiScore}점</p>
              <div style={{
                height: 4,
                background: 'var(--color-bg)',
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${match.mbtiScore}%` }}
                  transition={{ delay: 0.3 + idx * 0.15, duration: 0.8 }}
                  style={{
                    height: '100%',
                    background: 'var(--color-gold)',
                    borderRadius: 2
                  }}
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p className="text-xs text-muted mb-8">사주 {match.iljuScore}점</p>
              <div style={{
                height: 4,
                background: 'var(--color-bg)',
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${match.iljuScore}%` }}
                  transition={{ delay: 0.5 + idx * 0.15, duration: 0.8 }}
                  style={{
                    height: '100%',
                    background: 'var(--color-gold)',
                    borderRadius: 2
                  }}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted mt-8" style={{ textAlign: 'center' }}>
            {expandedIdx === idx ? '접기 ▲' : '상세보기 ▼'}
          </p>

          {/* Expanded Details */}
          {expandedIdx === idx && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              style={{ marginTop: 16 }}
            >
              {/* MBTI Details */}
              <div style={{
                padding: 16,
                background: 'rgba(212, 168, 67, 0.05)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 12
              }}>
                <p className="text-xs text-muted mb-8" style={{ letterSpacing: 1 }}>MBTI 궁합</p>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p className="text-xs text-muted">나</p>
                    <p style={{ color: 'var(--color-gold)', fontWeight: 700, fontSize: 18 }}>
                      {userProfile.mbti}
                    </p>
                  </div>
                  <span className="text-dim" style={{ fontSize: 20 }}>×</span>
                  <div style={{ textAlign: 'center' }}>
                    <p className="text-xs text-muted">상대</p>
                    <p style={{ color: 'var(--color-gold)', fontWeight: 700, fontSize: 18 }}>
                      {match.theirMbti}
                    </p>
                  </div>
                  <span className="text-dim" style={{ fontSize: 14, margin: '0 4px' }}>=</span>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: getScoreColor(match.mbtiScore), fontWeight: 700, fontSize: 18 }}>
                      {match.mbtiScore}점
                    </p>
                    <p style={{ color: getScoreColor(match.mbtiScore), fontSize: 12, fontWeight: 600 }}>
                      {getMbtiEvalLabel(match.mbtiScore)}
                    </p>
                  </div>
                </div>
                <p className="text-dim text-xs" style={{ lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{getMbtiRelationship(match.mbtiScore)}"
                </p>
              </div>

              {/* Saju Details */}
              <div style={{
                padding: 16,
                background: 'rgba(212, 168, 67, 0.05)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <p className="text-xs text-muted mb-8" style={{ letterSpacing: 1 }}>사주 궁합 (일주 오행)</p>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p className="text-xs text-muted">나</p>
                    <p style={{ color: 'var(--color-gold)', fontWeight: 700, fontSize: 16 }}>
                      {formatIljuDisplay(userProfile.ilju)}
                    </p>
                    <p className="text-xs text-muted">{formatOhaengDisplay(userProfile.ilju)}</p>
                  </div>
                  <span className="text-dim" style={{ fontSize: 20 }}>×</span>
                  <div style={{ textAlign: 'center' }}>
                    <p className="text-xs text-muted">상대</p>
                    <p style={{ color: 'var(--color-gold)', fontWeight: 700, fontSize: 16 }}>
                      {formatIljuDisplay(match.theirIlju)}
                    </p>
                    <p className="text-xs text-muted">{formatOhaengDisplay(match.theirIlju)}</p>
                  </div>
                  <span className="text-dim" style={{ fontSize: 14, margin: '0 4px' }}>=</span>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: getScoreColor(match.iljuScore), fontWeight: 700, fontSize: 18 }}>
                      {match.iljuScore}점
                    </p>
                    <p style={{ color: getScoreColor(match.iljuScore), fontSize: 12, fontWeight: 600 }}>
                      {getSajuEvalLabel(match.iljuScore)}
                    </p>
                  </div>
                </div>
                <p className="text-dim text-xs" style={{ lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{getSajuRelationship(match.iljuScore)}"
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}

      <button
        className="btn-secondary mt-16"
        onClick={() => { setLoading(true); findMatches(); }}
        style={{ maxWidth: 200, margin: '16px auto 0', display: 'block' }}
      >
        지금 새로고침
      </button>
    </div>
  );
}
