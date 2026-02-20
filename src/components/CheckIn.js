import React, { useState } from 'react';
import { getUser, createUser, checkIn } from '../services/firestoreService';

export default function CheckIn({ onCheckInComplete, staffCode, onLogoTap }) {
  const [step, setStep] = useState('staff_code'); // staff_code, auth
  const [codeInput, setCodeInput] = useState('');
  const [instagramId, setInstagramId] = useState('');
  const [password, setPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState(null); // null = unknown, true/false
  const [agreeShare, setAgreeShare] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStaffCodeSubmit = (e) => {
    e.preventDefault();
    if (codeInput === staffCode) {
      setStep('auth');
      setError('');
    } else {
      setError('스태프 코드가 올바르지 않습니다. 바텐더에게 확인해주세요.');
    }
  };

  const handleIdCheck = async (e) => {
    e.preventDefault();
    if (!instagramId.trim()) {
      setError('인스타그램 ID를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const user = await getUser(instagramId.trim().toLowerCase());
      setIsNewUser(!user);
      setError('');
    } catch (err) {
      setError('서버 연결에 실패했습니다. 다시 시도해주세요.');
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password || password.length !== 4) {
      setError('4자리 비밀번호를 입력해주세요.');
      return;
    }
    if (!agreeShare) {
      setError('매칭 시 인스타그램 ID 공개에 동의해주세요.');
      return;
    }

    setLoading(true);
    try {
      const userId = instagramId.trim().toLowerCase();

      if (isNewUser) {
        await createUser(userId, password);
        await checkIn(userId);
        onCheckInComplete(userId);
      } else {
        const user = await getUser(userId);
        if (user.password === password) {
          await checkIn(userId);
          onCheckInComplete(userId);
        } else {
          setError('비밀번호가 올바르지 않습니다.');
        }
      }
    } catch (err) {
      setError('체크인에 실패했습니다. 다시 시도해주세요.');
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="logo" onClick={onLogoTap}>TAPE</div>
      <div className="subtitle">SEOUL · ITAEWON</div>

      {step === 'staff_code' && (
        <form onSubmit={handleStaffCodeSubmit} className="card">
          <h3 style={{ color: 'var(--color-gold)', marginBottom: 4, fontSize: 16 }}>
            스태프 코드 입력
          </h3>
          <p className="text-dim text-sm mb-16">
            음료 주문 후 바텐더에게 코드를 받으세요
          </p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            className="input-field"
            placeholder="4자리 코드 입력"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            autoFocus
            style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
          />
          {error && <p className="error-msg mt-8">{error}</p>}
          <button
            type="submit"
            className="btn-primary mt-16"
            disabled={codeInput.length !== 4}
          >
            확인
          </button>
        </form>
      )}

      {step === 'auth' && isNewUser === null && (
        <form onSubmit={handleIdCheck} className="card">
          <h3 style={{ color: 'var(--color-gold)', marginBottom: 4, fontSize: 16 }}>
            체크인
          </h3>
          <p className="text-dim text-sm mb-16">
            인스타그램 ID를 입력해주세요
          </p>
          <input
            type="text"
            className="input-field"
            placeholder="@instagram_id"
            value={instagramId}
            onChange={(e) => {
              setInstagramId(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''));
              setError('');
            }}
            autoFocus
          />
          <p className="text-xs text-muted mt-8">
            * 인스타그램 ID 검증은 하지 않으나, 가짜 ID 사용 시 쿠폰 혜택에서 제외될 수 있습니다.
          </p>
          {error && <p className="error-msg mt-8">{error}</p>}
          <button
            type="submit"
            className="btn-primary mt-16"
            disabled={!instagramId.trim() || loading}
          >
            {loading ? '확인 중...' : '다음'}
          </button>
        </form>
      )}

      {step === 'auth' && isNewUser !== null && (
        <form onSubmit={handleLogin} className="card">
          <h3 style={{ color: 'var(--color-gold)', marginBottom: 4, fontSize: 16 }}>
            {isNewUser ? '환영합니다! 비밀번호를 설정해주세요' : `@${instagramId} 님, 반갑습니다`}
          </h3>
          <p className="text-dim text-sm mb-16">
            {isNewUser ? '4자리 숫자 비밀번호를 만들어주세요' : '비밀번호를 입력해주세요'}
          </p>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            className="input-field"
            placeholder="4자리 비밀번호"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            autoFocus
            style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
          />

          <label
            className="mt-16"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--color-text-dim)',
              lineHeight: 1.4
            }}
          >
            <input
              type="checkbox"
              checked={agreeShare}
              onChange={(e) => setAgreeShare(e.target.checked)}
              style={{
                marginTop: 2,
                accentColor: 'var(--color-gold)',
                width: 18,
                height: 18,
                flexShrink: 0
              }}
            />
            매칭 시 상대방에게 인스타그램 ID가 공개되는 것에 동의합니다.
          </label>

          {error && <p className="error-msg mt-8">{error}</p>}
          <button
            type="submit"
            className="btn-primary mt-16"
            disabled={password.length !== 4 || !agreeShare || loading}
          >
            {loading ? '체크인 중...' : '체크인'}
          </button>

          <button
            type="button"
            className="btn-secondary mt-12"
            onClick={() => {
              setIsNewUser(null);
              setPassword('');
              setError('');
            }}
          >
            다른 ID로 로그인
          </button>
        </form>
      )}
    </div>
  );
}
