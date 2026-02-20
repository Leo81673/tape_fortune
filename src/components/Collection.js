import React from 'react';
import { motion } from 'framer-motion';
import TAROT_CARDS from '../data/tarotCards';

export default function Collection({ userCollection = [] }) {
  const isComplete = userCollection.length === 22 &&
    TAROT_CARDS.every(card => userCollection.includes(card.id));

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ color: 'var(--color-gold)', fontSize: 16 }}>
          타로카드 도감
        </h3>
        <span className="text-dim text-sm">
          {TAROT_CARDS.filter(c => userCollection.includes(c.id)).length} / 22
        </span>
      </div>

      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card mb-16"
          style={{
            background: 'linear-gradient(135deg, #2a1a0a, #1a1400)',
            border: '1px solid var(--color-gold)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
          <p style={{ color: 'var(--color-gold)', fontWeight: 700, fontSize: 18 }}>
            컴플리트!
          </p>
          <p className="text-dim text-sm mt-8">
            22장의 메이저 아르카나를 모두 수집했습니다!<br/>
            바텐더에게 특별 보상을 확인하세요.
          </p>
        </motion.div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8
        }}
      >
        {TAROT_CARDS.map((card) => {
          const owned = userCollection.includes(card.id);
          return (
            <motion.div
              key={card.id}
              whileHover={owned ? { scale: 1.05 } : {}}
              style={{
                background: owned
                  ? 'linear-gradient(135deg, #1a1520, #14141f)'
                  : 'var(--color-bg-input)',
                border: `1px solid ${owned ? 'var(--color-gold-dark)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '12px 4px',
                textAlign: 'center',
                position: 'relative',
                opacity: owned ? 1 : 0.4,
                minHeight: 90,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{ fontSize: owned ? 28 : 20, marginBottom: 4 }}>
                {owned ? card.emoji : '🔒'}
              </div>
              <p style={{
                fontSize: 9,
                color: owned ? 'var(--color-gold)' : 'var(--color-text-muted)',
                fontWeight: owned ? 500 : 400,
                lineHeight: 1.3
              }}>
                {card.id}
              </p>
              <p style={{
                fontSize: 8,
                color: owned ? 'var(--color-text-dim)' : 'var(--color-text-muted)',
                lineHeight: 1.2,
                marginTop: 2
              }}>
                {owned ? card.nameKr : '???'}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
