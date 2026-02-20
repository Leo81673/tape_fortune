import React, { useState } from 'react';
import { MBTI_TYPES } from '../utils/mbtiCompatibility';
import { calculateIlju } from '../utils/ilju';
import { lunarToSolar } from '../utils/lunarConverter';
import { updateUserProfile } from '../services/firestoreService';

export default function MbtiProfile({ userId, userProfile, onProfileUpdated }) {
  const [mbti, setMbti] = useState(userProfile?.mbti || '');
  const [calendarType, setCalendarType] = useState(userProfile?.calendar_type || 'solar');
  const [year, setYear] = useState(userProfile?.birthday ? userProfile.birthday.split('-')[0] : '');
  const [month, setMonth] = useState(userProfile?.birthday ? userProfile.birthday.split('-')[1] : '');
  const [day, setDay] = useState(userProfile?.birthday ? userProfile.birthday.split('-')[2] : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!mbti) {
      setError('MBTI를 선택해주세요.');
      return;
    }
    if (!year || !month || !day) {
      setError('생년월일을 모두 입력해주세요.');
      return;
    }

    const y = parseInt(year);
    const m = parseInt(month);
    const d = parseInt(day);

    if (y < 1920 || y > 2010 || m < 1 || m > 12 || d < 1 || d > 31) {
      setError('유효한 생년월일을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      let solarYear = y, solarMonth = m, solarDay = d;

      if (calendarType === 'lunar') {
        try {
          const solar = lunarToSolar(y, m, d);
          solarYear = solar.year;
          solarMonth = solar.month;
          solarDay = solar.day;
        } catch (err) {
          setError('음력 날짜 변환에 실패했습니다. 날짜를 확인해주세요.');
          setLoading(false);
          return;
        }
      }

      const ilju = calculateIlju(solarYear, solarMonth, solarDay);

      await updateUserProfile(userId, {
        mbti: mbti,
        birthday: `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        calendar_type: calendarType,
        ilju: ilju
      });

      setSaved(true);
      if (onProfileUpdated) {
        onProfileUpdated({ mbti, birthday: `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, calendar_type: calendarType, ilju });
      }
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px 0' }}>
      <h3 style={{ color: 'var(--color-gold)', fontSize: 16, marginBottom: 4 }}>
        MBTI & 생년월일
      </h3>
      <p className="text-dim text-sm mb-16">
        매칭을 위해 정보를 입력해주세요. 한 번만 입력하면 저장됩니다.
      </p>

      {/* MBTI Selection */}
      <label className="text-xs text-muted mb-8" style={{ display: 'block' }}>
        MBTI
      </label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
          marginBottom: 20
        }}
      >
        {MBTI_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setMbti(type)}
            style={{
              padding: '8px 4px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontWeight: mbti === type ? 700 : 400,
              background: mbti === type
                ? 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))'
                : 'var(--color-bg-input)',
              color: mbti === type ? '#0a0a0f' : 'var(--color-text-dim)',
              border: `1px solid ${mbti === type ? 'var(--color-gold)' : 'var(--color-border)'}`,
              transition: 'all 0.15s ease'
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Calendar Type */}
      <label className="text-xs text-muted mb-8" style={{ display: 'block' }}>
        생년월일
      </label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => setCalendarType('solar')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontWeight: calendarType === 'solar' ? 700 : 400,
            background: calendarType === 'solar'
              ? 'rgba(212, 168, 67, 0.2)'
              : 'var(--color-bg-input)',
            color: calendarType === 'solar' ? 'var(--color-gold)' : 'var(--color-text-dim)',
            border: `1px solid ${calendarType === 'solar' ? 'var(--color-gold-dark)' : 'var(--color-border)'}`
          }}
        >
          양력
        </button>
        <button
          type="button"
          onClick={() => setCalendarType('lunar')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontWeight: calendarType === 'lunar' ? 700 : 400,
            background: calendarType === 'lunar'
              ? 'rgba(212, 168, 67, 0.2)'
              : 'var(--color-bg-input)',
            color: calendarType === 'lunar' ? 'var(--color-gold)' : 'var(--color-text-dim)',
            border: `1px solid ${calendarType === 'lunar' ? 'var(--color-gold-dark)' : 'var(--color-border)'}`
          }}
        >
          음력
        </button>
      </div>

      {/* Date inputs */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          className="input-field"
          placeholder="년 (YYYY)"
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))}
          style={{ flex: 2 }}
        />
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          className="input-field"
          placeholder="월"
          value={month}
          onChange={(e) => setMonth(e.target.value.replace(/\D/g, ''))}
          style={{ flex: 1 }}
        />
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          className="input-field"
          placeholder="일"
          value={day}
          onChange={(e) => setDay(e.target.value.replace(/\D/g, ''))}
          style={{ flex: 1 }}
        />
      </div>

      {userProfile?.ilju && (
        <div className="mt-12 text-center">
          <span className="text-xs text-muted">일주: </span>
          <span className="text-gold text-sm font-bold">
            {userProfile.ilju.cheongan}{userProfile.ilju.jiji}
            ({userProfile.ilju.cheonganHanja}{userProfile.ilju.jijiHanja})
          </span>
          <span className="text-xs text-muted">
            {' '}— {userProfile.ilju.ohaeng.cheongan}/{userProfile.ilju.ohaeng.jiji}
          </span>
        </div>
      )}

      {error && <p className="error-msg mt-8">{error}</p>}

      <button
        type="submit"
        className="btn-primary mt-16"
        disabled={loading}
      >
        {loading ? '저장 중...' : saved ? '저장 완료!' : '저장하기'}
      </button>
    </form>
  );
}
