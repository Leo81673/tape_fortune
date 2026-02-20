/**
 * Major Arcana Tarot Cards (22 cards)
 */
const TAROT_CARDS = [
  { id: 0, name: 'The Fool', nameKr: '광대', emoji: '🃏', meaning: '새로운 시작, 모험, 무한한 가능성' },
  { id: 1, name: 'The Magician', nameKr: '마법사', emoji: '🎩', meaning: '창조력, 의지, 집중의 힘' },
  { id: 2, name: 'The High Priestess', nameKr: '여사제', emoji: '🌙', meaning: '직감, 내면의 지혜, 신비' },
  { id: 3, name: 'The Empress', nameKr: '여황제', emoji: '👑', meaning: '풍요, 아름다움, 자연의 축복' },
  { id: 4, name: 'The Emperor', nameKr: '황제', emoji: '🏛️', meaning: '권위, 안정, 확고한 기반' },
  { id: 5, name: 'The Hierophant', nameKr: '교황', emoji: '📿', meaning: '전통, 가르침, 영적 인도' },
  { id: 6, name: 'The Lovers', nameKr: '연인', emoji: '💕', meaning: '사랑, 조화, 운명적 선택' },
  { id: 7, name: 'The Chariot', nameKr: '전차', emoji: '⚡', meaning: '승리, 전진, 강한 의지' },
  { id: 8, name: 'Strength', nameKr: '힘', emoji: '🦁', meaning: '내면의 힘, 용기, 인내' },
  { id: 9, name: 'The Hermit', nameKr: '은둔자', emoji: '🏔️', meaning: '성찰, 고독, 내면 탐구' },
  { id: 10, name: 'Wheel of Fortune', nameKr: '운명의 수레바퀴', emoji: '🎡', meaning: '변화, 전환점, 운명의 흐름' },
  { id: 11, name: 'Justice', nameKr: '정의', emoji: '⚖️', meaning: '균형, 공정, 진실' },
  { id: 12, name: 'The Hanged Man', nameKr: '매달린 사람', emoji: '🔄', meaning: '새로운 관점, 희생, 깨달음' },
  { id: 13, name: 'Death', nameKr: '죽음', emoji: '🦋', meaning: '변환, 끝과 새로운 시작' },
  { id: 14, name: 'Temperance', nameKr: '절제', emoji: '🌈', meaning: '조화, 균형, 인내의 미덕' },
  { id: 15, name: 'The Devil', nameKr: '악마', emoji: '🔥', meaning: '유혹, 욕망, 속박으로부터의 해방' },
  { id: 16, name: 'The Tower', nameKr: '탑', emoji: '💥', meaning: '급격한 변화, 해방, 진실의 순간' },
  { id: 17, name: 'The Star', nameKr: '별', emoji: '⭐', meaning: '희망, 영감, 내면의 빛' },
  { id: 18, name: 'The Moon', nameKr: '달', emoji: '🌕', meaning: '환상, 직감, 숨겨진 진실' },
  { id: 19, name: 'The Sun', nameKr: '태양', emoji: '☀️', meaning: '기쁨, 성공, 활력' },
  { id: 20, name: 'Judgement', nameKr: '심판', emoji: '📯', meaning: '각성, 부활, 새로운 장' },
  { id: 21, name: 'The World', nameKr: '세계', emoji: '🌍', meaning: '완성, 성취, 새 여정의 시작' }
];

export default TAROT_CARDS;

export function getRandomTarotCard() {
  return TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
}
