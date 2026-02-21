import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUser, createUser, checkIn } from '../services/firestoreService';

export default function CheckIn({ onCheckInComplete, staffCode, onLogoTap }) {
  // Steps: fortune_tap → credentials (staff code + insta) → password
  const [step, setStep] = useState('fortune_tap');
  const [codeInput, setCodeInput] = useState('');
  const [instagramId, setInstagramId] = useState('');
  const [password, setPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (codeInput !== staffCode) {
      setError('스태프 코드가 올바르지 않습니다. 바텐더에게 확인해주세요.');
      return;
    }
    if (!instagramId.trim()) {
      setError('인스타그램 ID를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const user = await getUser(instagramId.trim().toLowerCase());
      setIsNewUser(!user);
      setStep('password');
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

      <AnimatePresence mode="wait">
        {step === 'fortune_tap' && (
          <motion.div
            key="fortune_tap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
          >
            <p className="text-dim text-sm mb-16">
              포춘쿠키를 터치하여 시작하세요
            </p>
            <motion.button
              onClick={() => setStep('credentials')}
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

        {step === 'credentials' && (
          <motion.div
            key="credentials"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <form onSubmit={handleCredentialsSubmit} className="card">
              <h3 style={{ color: 'var(--color-gold)', marginBottom: 4, fontSize: 16 }}>
                체크인
              </h3>
              <p className="text-dim text-sm mb-16">
                음료 주문 후 바텐더에게 받은 코드와<br />인스타그램 ID를 입력해주세요
              </p>

              <label className="text-xs text-muted mb-8" style={{ display: 'block' }}>
                스태프 코드
              </label>
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
                style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, marginBottom: 16 }}
              />

              <label className="text-xs text-muted mb-8" style={{ display: 'block' }}>
                인스타그램 ID
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="@instagram_id"
                value={instagramId}
                onChange={(e) => {
                  setInstagramId(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''));
                  setError('');
                }}
              />
              <p className="text-xs text-muted mt-8">
                * 인스타그램 ID 검증은 하지 않으나, 가짜 ID 사용 시 쿠폰 혜택에서 제외될 수 있습니다.
              </p>

              {error && <p className="error-msg mt-8">{error}</p>}
              <button
                type="submit"
                className="btn-primary mt-16"
                disabled={codeInput.length !== 4 || !instagramId.trim() || loading}
              >
                {loading ? '확인 중...' : '다음'}
              </button>
            </form>
          </motion.div>
        )}

        {step === 'password' && (
          <motion.div
            key="password"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
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

              {error && <p className="error-msg mt-8">{error}</p>}
              <button
                type="submit"
                className="btn-primary mt-16"
                disabled={password.length !== 4 || loading}
              >
                {loading ? '체크인 중...' : '체크인'}
              </button>

              <button
                type="button"
                className="btn-secondary mt-12"
                onClick={() => {
                  setStep('credentials');
                  setPassword('');
                  setIsNewUser(null);
                  setError('');
                }}
              >
                이전으로
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
