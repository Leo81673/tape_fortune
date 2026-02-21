/**
 * Daily horoscope generator based on zodiac sign (별자리) and saju (오행).
 * Generates deterministic daily horoscope using date seed + user's birth info.
 */

const ZODIAC_SIGNS = [
  { name: '물병자리', nameEn: 'Aquarius', emoji: '♒', start: [1, 20], end: [2, 18] },
  { name: '물고기자리', nameEn: 'Pisces', emoji: '♓', start: [2, 19], end: [3, 20] },
  { name: '양자리', nameEn: 'Aries', emoji: '♈', start: [3, 21], end: [4, 19] },
  { name: '황소자리', nameEn: 'Taurus', emoji: '♉', start: [4, 20], end: [5, 20] },
  { name: '쌍둥이자리', nameEn: 'Gemini', emoji: '♊', start: [5, 21], end: [6, 21] },
  { name: '게자리', nameEn: 'Cancer', emoji: '♋', start: [6, 22], end: [7, 22] },
  { name: '사자자리', nameEn: 'Leo', emoji: '♌', start: [7, 23], end: [8, 22] },
  { name: '처녀자리', nameEn: 'Virgo', emoji: '♍', start: [8, 23], end: [9, 22] },
  { name: '천칭자리', nameEn: 'Libra', emoji: '♎', start: [9, 23], end: [10, 23] },
  { name: '전갈자리', nameEn: 'Scorpio', emoji: '♏', start: [10, 24], end: [11, 21] },
  { name: '사수자리', nameEn: 'Sagittarius', emoji: '♐', start: [11, 22], end: [12, 21] },
  { name: '염소자리', nameEn: 'Capricorn', emoji: '♑', start: [12, 22], end: [1, 19] },
];

export function getZodiacSign(month, day) {
  for (const sign of ZODIAC_SIGNS) {
    const [sm, sd] = sign.start;
    const [em, ed] = sign.end;

    if (sm <= em) {
      // Normal range (same year)
      if ((month === sm && day >= sd) || (month === em && day <= ed) ||
          (month > sm && month < em)) {
        return sign;
      }
    } else {
      // Wraps around year (Capricorn: Dec 22 - Jan 19)
      if ((month === sm && day >= sd) || (month === em && day <= ed) ||
          month > sm || month < em) {
        return sign;
      }
    }
  }
  return ZODIAC_SIGNS[0]; // fallback
}

// Simple seeded pseudo-random for deterministic daily results
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDaySeed() {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const dateStr = kstNow.toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const HOROSCOPE_TEMPLATES = {
  love: [
    '사랑의 기운이 충만한 하루예요. 마음을 여세요.',
    '로맨틱한 에너지가 당신을 감싸고 있어요.',
    '새로운 인연의 신호를 놓치지 마세요.',
    '진심 어린 대화가 관계를 깊게 만들어요.',
    '오늘 만나는 사람에게 특별한 감정을 느낄 수 있어요.',
    '솔직한 감정 표현이 행운을 가져다줘요.',
  ],
  social: [
    '사교 운이 높은 하루예요. 적극적으로 다가가보세요.',
    '주변 사람들에게 좋은 인상을 남길 수 있는 날이에요.',
    '새로운 모임에서 즐거운 시간을 보낼 수 있어요.',
    '당신의 유머 감각이 사람들의 마음을 사로잡아요.',
    '소통의 에너지가 활발한 날이에요.',
    '오늘은 다양한 사람들과의 교류가 행운을 불러요.',
  ],
  luck: [
    '작은 행운이 곳곳에 숨어있는 하루예요.',
    '예상치 못한 기쁜 소식이 올 수 있어요.',
    '직감이 특히 강한 날이에요. 느낌을 믿으세요.',
    '우연한 만남에서 좋은 기회가 생겨요.',
    '긍정적인 마음가짐이 행운을 끌어당겨요.',
    '오늘은 뭘 해도 잘 풀리는 날이에요.',
  ],
  energy: [
    '활기찬 에너지로 가득 찬 밤이에요.',
    '차분한 에너지가 당신을 감싸는 밤이에요.',
    '내면의 힘이 빛나는 시간이에요.',
    '자신감 넘치는 에너지로 무장한 밤이에요.',
    '여유로운 에너지가 매력을 더해줘요.',
    '열정적인 에너지가 주변을 밝히는 밤이에요.',
  ]
};

// 오행별 보너스 메시지
const OHAENG_BONUS = {
  목: '목(木)의 기운이 성장의 에너지를 더해주는 날이에요.',
  화: '화(火)의 기운이 열정을 불태우는 날이에요.',
  토: '토(土)의 기운이 안정감을 선물하는 날이에요.',
  금: '금(金)의 기운이 결단력을 높여주는 날이에요.',
  수: '수(水)의 기운이 직감을 날카롭게 해주는 날이에요.',
};

/**
 * Generate daily horoscope for a user.
 * Returns null if user has no birthday info.
 */
export function generateDailyHoroscope(userProfile) {
  if (!userProfile?.birthday) return null;

  const [, monthStr, dayStr] = userProfile.birthday.split('-');
  const month = parseInt(monthStr);
  const day = parseInt(dayStr);
  const zodiac = getZodiacSign(month, day);

  const daySeed = getDaySeed();
  // Combine zodiac index with date for unique-per-sign daily result
  const zodiacIdx = ZODIAC_SIGNS.indexOf(zodiac);
  const seed = daySeed + zodiacIdx * 1000;

  const categories = Object.keys(HOROSCOPE_TEMPLATES);
  const selectedCategory = categories[Math.floor(seededRandom(seed) * categories.length)];
  const messages = HOROSCOPE_TEMPLATES[selectedCategory];
  const message = messages[Math.floor(seededRandom(seed + 1) * messages.length)];

  // Lucky score (1-5 stars)
  const luckyScore = Math.floor(seededRandom(seed + 2) * 5) + 1;

  // Ohaeng bonus message if user has ilju data
  let ohaengMessage = null;
  if (userProfile.ilju?.ohaeng?.cheongan) {
    ohaengMessage = OHAENG_BONUS[userProfile.ilju.ohaeng.cheongan] || null;
  }

  return {
    zodiac: zodiac.name,
    zodiacEmoji: zodiac.emoji,
    message,
    luckyScore,
    ohaengMessage,
    category: selectedCategory
  };
}
