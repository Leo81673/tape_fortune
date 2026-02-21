import React, { useState, useEffect, useCallback } from 'react';
import {
  getAdminConfig,
  getTodayCheckedInUsers,
  resetDaily,
  updateAdminConfig,
  getAllUsers
} from '../services/firestoreService';
import { getMbtiCompatibility } from '../utils/mbtiCompatibility';
import { calculateIljuCompatibility } from '../utils/ilju';
import TAROT_CARDS from '../data/tarotCards';

export default function AdminPanel({ onClose }) {
  const [config, setConfig] = useState(null);
  const [users, setUsers] = useState([]);
  const [topMatches, setTopMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  // Fortune coupon editing state
  const [editCoupons, setEditCoupons] = useState([]);
  const [editTimerMinutes, setEditTimerMinutes] = useState(30);
  const [savingCoupons, setSavingCoupons] = useState(false);

  // Card settings editing state
  const [editCardSettings, setEditCardSettings] = useState({});
  const [savingCards, setSavingCards] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [adminConfig, checkedInUsers, allUsers] = await Promise.all([
        getAdminConfig(),
        getTodayCheckedInUsers(),
        getAllUsers()
      ]);
      setConfig(adminConfig);
      setUsers(checkedInUsers);
      setTopMatches(calculateTopMatches(allUsers));

      // Initialize edit states
      setEditCoupons(adminConfig.fortune_coupons || []);
      setEditTimerMinutes(adminConfig.coupon_timer_minutes || 30);
      setEditCardSettings(adminConfig.card_settings || {});
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
    setLoading(false);
  }, []);

  const calculateTopMatches = (allUsers) => {
    const candidates = allUsers.filter((user) => user?.mbti && user?.ilju);
    const matches = [];

    for (let i = 0; i < candidates.length; i += 1) {
      for (let j = i + 1; j < candidates.length; j += 1) {
        const userA = candidates[i];
        const userB = candidates[j];
        const mbtiScore = getMbtiCompatibility(userA.mbti, userB.mbti);
        const iljuScore = calculateIljuCompatibility(userA.ilju, userB.ilju);
        const totalScore = Math.round(mbtiScore * 0.5 + iljuScore * 0.5);

        matches.push({
          key: `${userA.id}-${userB.id}`,
          userA: userA.id,
          userB: userB.id,
          totalScore,
          mbtiScore,
          iljuScore
        });
      }
    }

    return matches.sort((a, b) => b.totalScore - a.totalScore).slice(0, 10);
  };

  const handleLocationCheckToggle = async () => {
    if (!config || savingLocation) return;

    const nextValue = config.location_check_enabled === false;
    setSavingLocation(true);

    try {
      await updateAdminConfig({ location_check_enabled: nextValue });
      setConfig((prev) => ({ ...prev, location_check_enabled: nextValue }));
    } catch (err) {
      console.error('Failed to update location check config:', err);
      alert('위치기반 확인 설정 저장에 실패했습니다.');
    }

    setSavingLocation(false);
  };

  const handleReset = async () => {
    if (!window.confirm('정말로 오늘의 데이터를 초기화하시겠습니까?')) return;
    setResetting(true);
    try {
      await resetDaily();
      await loadData();
      alert('초기화가 완료되었습니다.');
    } catch (err) {
      alert('초기화에 실패했습니다.');
    }
    setResetting(false);
  };

  // Fortune coupon handlers
  const handleCouponChange = (idx, field, value) => {
    setEditCoupons(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSaveCoupons = async () => {
    setSavingCoupons(true);
    try {
      const cleaned = editCoupons.map(c => ({
        ...c,
        probability: parseFloat(c.probability) || 0
      }));
      await updateAdminConfig({
        fortune_coupons: cleaned,
        coupon_timer_minutes: parseInt(editTimerMinutes) || 30
      });
      setConfig(prev => ({
        ...prev,
        fortune_coupons: cleaned,
        coupon_timer_minutes: parseInt(editTimerMinutes) || 30
      }));
      alert('쿠폰 설정이 저장되었습니다.');
    } catch (err) {
      alert('저장에 실패했습니다.');
    }
    setSavingCoupons(false);
  };

  // Card settings handlers
  const handleCardSettingChange = (cardId, field, value) => {
    setEditCardSettings(prev => ({
      ...prev,
      [cardId]: {
        ...(prev[cardId] || {}),
        [field]: value
      }
    }));
  };

  const handleSaveCardSettings = async () => {
    setSavingCards(true);
    try {
      const cleaned = {};
      Object.entries(editCardSettings).forEach(([cardId, settings]) => {
        cleaned[cardId] = {
          probability: parseFloat(settings.probability) || (100 / 22),
          coupon_text: settings.coupon_text || ''
        };
      });
      await updateAdminConfig({ card_settings: cleaned });
      setConfig(prev => ({ ...prev, card_settings: cleaned }));
      alert('카드 설정이 저장되었습니다.');
    } catch (err) {
      alert('저장에 실패했습니다.');
    }
    setSavingCards(false);
  };

  if (loading) {
    return (
      <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p className="text-dim">로딩 중...</p>
      </div>
    );
  }

  const sections = [
    { id: 'overview', label: '현황' },
    { id: 'coupons', label: '쿠폰 관리' },
    { id: 'cards', label: '카드 관리' },
    { id: 'settings', label: '설정' }
  ];

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: 'var(--color-gold)', fontSize: 18 }}>관리자 모드</h2>
        <button
          onClick={onClose}
          style={{
            color: 'var(--color-text-dim)',
            fontSize: 14,
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)'
          }}
        >
          닫기
        </button>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto' }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontWeight: activeSection === s.id ? 700 : 400,
              background: activeSection === s.id
                ? 'rgba(212, 168, 67, 0.2)'
                : 'var(--color-bg-input)',
              color: activeSection === s.id ? 'var(--color-gold)' : 'var(--color-text-dim)',
              border: `1px solid ${activeSection === s.id ? 'var(--color-gold-dark)' : 'var(--color-border)'}`,
              whiteSpace: 'nowrap'
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <>
          <div className="card mb-16">
            <p className="text-xs text-muted mb-8">오늘의 스태프 코드</p>
            <p style={{
              fontSize: 36,
              fontWeight: 700,
              color: 'var(--color-gold)',
              letterSpacing: 8,
              textAlign: 'center'
            }}>
              {config?.daily_staff_code || '----'}
            </p>
            <p className="text-xs text-muted text-center mt-8">
              매일 밤 9시에 자동 변경됩니다
            </p>
          </div>

          <div className="card mb-16">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p className="text-xs text-muted">오늘 체크인 ({users.length}명)</p>
              <button
                onClick={loadData}
                className="text-xs text-gold"
                style={{ padding: '4px 8px' }}
              >
                새로고침
              </button>
            </div>
            {users.length === 0 ? (
              <p className="text-dim text-sm text-center" style={{ padding: '16px 0' }}>
                아직 체크인한 유저가 없습니다
              </p>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {users.map((user, idx) => (
                  <div
                    key={user.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: idx < users.length - 1 ? '1px solid var(--color-border)' : 'none'
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 14, color: 'var(--color-text)' }}>
                        @{user.id}
                      </p>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        {user.fortune_opened && (
                          <span className="text-xs" style={{ color: 'var(--color-gold)' }}>
                            포춘열람
                          </span>
                        )}
                        {user.coupon_won && (
                          <span className="text-xs" style={{ color: 'var(--color-success)' }}>
                            쿠폰당첨
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted">
                      {user.checked_in_at?.toDate
                        ? new Date(user.checked_in_at.toDate()).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card mb-16">
            <p className="text-xs text-muted mb-12">전체 DB 기준 상위 궁합 TOP 10</p>
            {topMatches.length === 0 ? (
              <p className="text-dim text-sm text-center" style={{ padding: '8px 0' }}>
                MBTI/일주 정보가 있는 유저가 부족합니다
              </p>
            ) : (
              topMatches.map((match, idx) => (
                <div
                  key={match.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: idx < topMatches.length - 1 ? '1px solid var(--color-border)' : 'none'
                  }}
                >
                  <span style={{ fontSize: 14 }}>@{match.userA} ↔ @{match.userB}</span>
                  <span className="text-sm" style={{ color: 'var(--color-gold)' }}>
                    {match.totalScore}점
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="card mb-16">
            <p className="text-xs text-muted mb-12">쿠폰 당첨 내역</p>
            {(() => {
              const winners = users.filter(u => u.coupon_won);
              if (winners.length === 0) {
                return (
                  <p className="text-dim text-sm text-center" style={{ padding: '8px 0' }}>
                    오늘의 쿠폰 당첨자가 없습니다
                  </p>
                );
              }
              return winners.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0'
                  }}
                >
                  <span style={{ fontSize: 14 }}>@{user.id}</span>
                  <span className="text-sm" style={{ color: 'var(--color-gold)' }}>
                    {typeof user.coupon_won === 'object' ? user.coupon_won.name : user.coupon_won}
                  </span>
                </div>
              ));
            })()}
          </div>
        </>
      )}

      {/* Coupons Management Section */}
      {activeSection === 'coupons' && (
        <>
          <div className="card mb-16">
            <p className="text-xs text-muted mb-12">포춘쿠키 쿠폰 설정 (최대 3종)</p>
            <p className="text-xs text-muted mb-16" style={{ lineHeight: 1.5 }}>
              포춘쿠키 오픈 시 랜덤으로 지급되는 쿠폰의 종류, 확률, 문구를 설정합니다.
            </p>
            {editCoupons.map((coupon, idx) => (
              <div
                key={idx}
                style={{
                  padding: 16,
                  background: 'var(--color-bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 12
                }}
              >
                <p className="text-xs text-gold mb-8">쿠폰 {idx + 1}</p>
                <div style={{ marginBottom: 8 }}>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>이름</label>
                  <input
                    type="text"
                    className="input-field"
                    value={coupon.name || ''}
                    onChange={(e) => handleCouponChange(idx, 'name', e.target.value)}
                    placeholder="쿠폰 이름"
                    style={{ fontSize: 14 }}
                  />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>문구</label>
                  <input
                    type="text"
                    className="input-field"
                    value={coupon.text || ''}
                    onChange={(e) => handleCouponChange(idx, 'text', e.target.value)}
                    placeholder="쿠폰에 표시될 문구"
                    style={{ fontSize: 14 }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>
                    확률 (0~1, 예: 0.05 = 5%)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input-field"
                    value={coupon.probability ?? ''}
                    onChange={(e) => handleCouponChange(idx, 'probability', e.target.value)}
                    placeholder="0.05"
                    style={{ fontSize: 14 }}
                  />
                </div>
              </div>
            ))}

            {editCoupons.length < 3 && (
              <button
                className="btn-secondary mb-12"
                onClick={() => setEditCoupons(prev => [
                  ...prev,
                  { id: `coupon_${prev.length + 1}`, name: '', probability: 0, text: '' }
                ])}
                style={{ fontSize: 13 }}
              >
                + 쿠폰 추가
              </button>
            )}
          </div>

          <div className="card mb-16">
            <p className="text-xs text-muted mb-8">쿠폰 유효시간 (분)</p>
            <input
              type="text"
              inputMode="numeric"
              className="input-field"
              value={editTimerMinutes}
              onChange={(e) => setEditTimerMinutes(e.target.value.replace(/\D/g, ''))}
              placeholder="30"
              style={{ fontSize: 14, textAlign: 'center' }}
            />
            <p className="text-xs text-muted mt-8 text-center">
              포춘쿠키 쿠폰, 카드 획득 쿠폰 모두에 적용됩니다
            </p>
          </div>

          <button
            className="btn-primary mb-16"
            onClick={handleSaveCoupons}
            disabled={savingCoupons}
          >
            {savingCoupons ? '저장 중...' : '쿠폰 설정 저장'}
          </button>
        </>
      )}

      {/* Card Settings Section */}
      {activeSection === 'cards' && (
        <>
          <div className="card mb-16">
            <p className="text-xs text-muted mb-8">카드별 획득 확률 & 쿠폰 문구</p>
            <p className="text-xs text-muted mb-16" style={{ lineHeight: 1.5 }}>
              22종 타로카드 각각의 획득 확률(%)과, 첫 획득 시 지급되는 쿠폰 문구를 설정합니다.
              확률 합계가 100%가 되지 않아도 자동으로 비례 배분됩니다.
            </p>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {TAROT_CARDS.map(card => {
                const setting = editCardSettings[card.id] || {};
                return (
                  <div
                    key={card.id}
                    style={{
                      padding: 12,
                      background: 'var(--color-bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 8
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>{card.emoji}</span>
                      <span className="text-sm text-gold" style={{ fontWeight: 600 }}>
                        {card.id}. {card.nameKr}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>
                          확률(%)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="input-field"
                          value={setting.probability ?? ''}
                          onChange={(e) => handleCardSettingChange(card.id, 'probability', e.target.value)}
                          placeholder={String(Math.round(10000 / 22) / 100)}
                          style={{ fontSize: 12 }}
                        />
                      </div>
                      <div style={{ flex: 2 }}>
                        <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>
                          쿠폰 문구
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={setting.coupon_text || ''}
                          onChange={(e) => handleCardSettingChange(card.id, 'coupon_text', e.target.value)}
                          placeholder="첫 획득 시 쿠폰 문구"
                          style={{ fontSize: 12 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            className="btn-primary mb-16"
            onClick={handleSaveCardSettings}
            disabled={savingCards}
          >
            {savingCards ? '저장 중...' : '카드 설정 저장'}
          </button>
        </>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <>
          <div className="card mb-16">
            <p className="text-xs text-muted mb-8">위치 기반 확인</p>
            <button
              className="btn-secondary"
              onClick={handleLocationCheckToggle}
              disabled={savingLocation}
              style={{
                borderColor: config?.location_check_enabled === false ? 'var(--color-border)' : 'var(--color-gold)',
                color: config?.location_check_enabled === false ? 'var(--color-text-dim)' : 'var(--color-gold)'
              }}
            >
              {savingLocation
                ? '저장 중...'
                : config?.location_check_enabled === false
                  ? '위치확인 꺼짐 (클릭하여 켜기)'
                  : '위치확인 켜짐 (클릭하여 끄기)'}
            </button>
            <p className="text-xs text-muted text-center mt-8">
              꺼두면 관리자 테스트 모드가 아니어도 위치 확인 없이 입장 가능합니다
            </p>
          </div>

          <button
            className="btn-secondary"
            onClick={handleReset}
            disabled={resetting}
            style={{
              borderColor: 'var(--color-error)',
              color: 'var(--color-error)'
            }}
          >
            {resetting ? '초기화 중...' : '수동 초기화'}
          </button>
          <p className="text-xs text-muted text-center mt-8">
            체크인, 포춘, 매칭 데이터를 초기화하고 새 스태프 코드를 생성합니다
          </p>
        </>
      )}
    </div>
  );
}
