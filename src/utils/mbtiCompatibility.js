/**
 * MBTI compatibility scores (0-100).
 * Based on commonly referenced MBTI compatibility charts.
 * Score categories:
 *   100 = Ideal match
 *   85  = Very compatible
 *   70  = Compatible
 *   55  = Neutral
 *   40  = Could work with effort
 *   25  = Challenging
 */

const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

// Compatibility matrix (symmetric)
const COMPATIBILITY = {
  'INTJ': { 'INTJ': 70, 'INTP': 85, 'ENTJ': 85, 'ENTP': 100, 'INFJ': 85, 'INFP': 70, 'ENFJ': 70, 'ENFP': 100, 'ISTJ': 55, 'ISFJ': 40, 'ESTJ': 55, 'ESFJ': 40, 'ISTP': 55, 'ISFP': 40, 'ESTP': 40, 'ESFP': 40 },
  'INTP': { 'INTP': 70, 'ENTJ': 100, 'ENTP': 85, 'INFJ': 70, 'INFP': 70, 'ENFJ': 70, 'ENFP': 85, 'ISTJ': 55, 'ISFJ': 40, 'ESTJ': 55, 'ESFJ': 40, 'ISTP': 70, 'ISFP': 40, 'ESTP': 55, 'ESFP': 40 },
  'ENTJ': { 'ENTJ': 70, 'ENTP': 85, 'INFJ': 85, 'INFP': 100, 'ENFJ': 70, 'ENFP': 85, 'ISTJ': 55, 'ISFJ': 55, 'ESTJ': 70, 'ESFJ': 55, 'ISTP': 55, 'ISFP': 55, 'ESTP': 55, 'ESFP': 55 },
  'ENTP': { 'ENTP': 70, 'INFJ': 100, 'INFP': 85, 'ENFJ': 85, 'ENFP': 85, 'ISTJ': 40, 'ISFJ': 40, 'ESTJ': 55, 'ESFJ': 55, 'ISTP': 55, 'ISFP': 55, 'ESTP': 70, 'ESFP': 55 },
  'INFJ': { 'INFJ': 70, 'INFP': 85, 'ENFJ': 70, 'ENFP': 100, 'ISTJ': 40, 'ISFJ': 55, 'ESTJ': 40, 'ESFJ': 55, 'ISTP': 40, 'ISFP': 55, 'ESTP': 40, 'ESFP': 40 },
  'INFP': { 'INFP': 70, 'ENFJ': 100, 'ENFP': 85, 'ISTJ': 40, 'ISFJ': 55, 'ESTJ': 40, 'ESFJ': 55, 'ISTP': 40, 'ISFP': 55, 'ESTP': 40, 'ESFP': 55 },
  'ENFJ': { 'ENFJ': 70, 'ENFP': 85, 'ISTJ': 55, 'ISFJ': 70, 'ESTJ': 55, 'ESFJ': 70, 'ISTP': 40, 'ISFP': 100, 'ESTP': 40, 'ESFP': 55 },
  'ENFP': { 'ENFP': 70, 'ISTJ': 40, 'ISFJ': 55, 'ESTJ': 40, 'ESFJ': 55, 'ISTP': 55, 'ISFP': 70, 'ESTP': 55, 'ESFP': 70 },
  'ISTJ': { 'ISTJ': 70, 'ISFJ': 85, 'ESTJ': 85, 'ESFJ': 85, 'ISTP': 70, 'ISFP': 55, 'ESTP': 70, 'ESFP': 70 },
  'ISFJ': { 'ISFJ': 70, 'ESTJ': 70, 'ESFJ': 85, 'ISTP': 55, 'ISFP': 70, 'ESTP': 55, 'ESFP': 85 },
  'ESTJ': { 'ESTJ': 70, 'ESFJ': 85, 'ISTP': 85, 'ISFP': 55, 'ESTP': 85, 'ESFP': 70 },
  'ESFJ': { 'ESFJ': 70, 'ISTP': 55, 'ISFP': 85, 'ESTP': 55, 'ESFP': 85 },
  'ISTP': { 'ISTP': 70, 'ISFP': 70, 'ESTP': 85, 'ESFP': 70 },
  'ISFP': { 'ISFP': 70, 'ESTP': 70, 'ESFP': 85 },
  'ESTP': { 'ESTP': 70, 'ESFP': 85 },
  'ESFP': { 'ESFP': 70 }
};

/**
 * MBTI relationship type descriptions.
 * Based on Socionics and MBTI interaction theory:
 * - Ideal/Dual: Complementary cognitive functions that complete each other
 * - Mirror: Similar worldview but different execution style
 * - Activity: Energizing and stimulating interaction
 * - Kindred: Same dominant function, easy understanding
 * - Semi-dual: Partial completion, comfortable but not fully satisfying
 * - Contrary: Different approaches to similar goals
 */
const MBTI_RELATIONSHIPS = {
  100: {
    label: '천생연분',
    description: '서로의 약점을 완벽히 보완하는 이상적인 조합이에요. 인지 기능이 상호보완적이라 대화가 자연스럽고, 함께 있으면 에너지가 충전되는 관계입니다.'
  },
  85: {
    label: '최고의 궁합',
    description: '핵심 가치관이 비슷하면서도 서로 다른 시각을 제공하는 조합이에요. 깊은 이해와 자극을 동시에 주고받을 수 있는 관계입니다.'
  },
  70: {
    label: '좋은 궁합',
    description: '비슷한 사고방식을 공유하면서도 적절한 차이가 있어 편안한 관계를 만들어요. 서로를 쉽게 이해하고 소통이 원활한 조합입니다.'
  },
  55: {
    label: '보통',
    description: '서로 다른 강점을 가진 조합이에요. 처음에는 낯설 수 있지만, 서로의 차이를 인정하면 새로운 시각을 배울 수 있는 관계입니다.'
  },
  40: {
    label: '도전적',
    description: '근본적으로 다른 방식으로 세상을 바라보는 조합이에요. 노력이 필요하지만, 서로에게서 가장 많이 성장할 수 있는 관계이기도 합니다.'
  }
};

/**
 * Get MBTI compatibility score between two types.
 * Returns a score from 0 to 100.
 */
export function getMbtiCompatibility(type1, type2) {
  if (!type1 || !type2) return 55;

  const t1 = type1.toUpperCase();
  const t2 = type2.toUpperCase();

  if (COMPATIBILITY[t1] && COMPATIBILITY[t1][t2] !== undefined) {
    return COMPATIBILITY[t1][t2];
  }
  if (COMPATIBILITY[t2] && COMPATIBILITY[t2][t1] !== undefined) {
    return COMPATIBILITY[t2][t1];
  }

  return 55; // default neutral
}

/**
 * Get MBTI evaluation label for a given score.
 */
export function getMbtiEvalLabel(score) {
  if (score >= 100) return MBTI_RELATIONSHIPS[100].label;
  if (score >= 85) return MBTI_RELATIONSHIPS[85].label;
  if (score >= 70) return MBTI_RELATIONSHIPS[70].label;
  if (score >= 55) return MBTI_RELATIONSHIPS[55].label;
  return MBTI_RELATIONSHIPS[40].label;
}

/**
 * Get MBTI relationship description for a given score.
 */
export function getMbtiRelationship(score) {
  if (score >= 100) return MBTI_RELATIONSHIPS[100].description;
  if (score >= 85) return MBTI_RELATIONSHIPS[85].description;
  if (score >= 70) return MBTI_RELATIONSHIPS[70].description;
  if (score >= 55) return MBTI_RELATIONSHIPS[55].description;
  return MBTI_RELATIONSHIPS[40].description;
}

export { MBTI_TYPES };
