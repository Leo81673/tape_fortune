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

export { MBTI_TYPES };
