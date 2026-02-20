import React, { useState, useEffect } from 'react';
import {
  getAdminConfig, getTodayCheckedInUsers, resetDaily
} from '../services/firestoreService';

export default function AdminPanel({ onClose }) {
  const [config, setConfig] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminConfig, checkedInUsers] = await Promise.all([
        getAdminConfig(),
        getTodayCheckedInUsers()
      ]);
      setConfig(adminConfig);
      setUsers(checkedInUsers);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
    setLoading(false);
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

  if (loading) {
    return (
      <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p className="text-dim">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
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

      {/* Staff Code */}
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

      {/* Today's Check-ins */}
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

      {/* Coupon Winners */}
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
                {user.coupon_won === 'shot_coupon' ? '샷 쿠폰' : '할인 쿠폰'}
              </span>
            </div>
          ));
        })()}
      </div>

      {/* Manual Reset */}
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
    </div>
  );
}
