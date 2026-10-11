// Completion certificate: the criteria, the learner's status and a verification code that ties
// the certificate to the results. This is a portfolio exercise, not an accreditation.
import { MISSIONS } from './missions.js';
import lessons from '../data/lessons.json' with { type: 'json' };
import { sha256 } from './sha256.js';

export const RULES = { lessonPass: 75, missionPass: 70, quizPass: 80, quizMin: 10, drillPass: 70, drillRegions: 4, distinctionMissions: 14, distinctionScore: 85 };

export function certificateStatus({ attempts, lessonsDone }) {
  const missionScores = MISSIONS.map((m) => {
    const a = attempts.filter((x) => x.kind === 'mission' && x.missionId === m.id);
    const best = a.length ? a.reduce((b, x) => (x.score > b.score ? x : b)) : null;
    return { id: m.id, title: m.title, region: m.region, score: best?.score ?? null, difficulty: best?.difficulty ?? null };
  });
  const lessonScores = lessons.lessons.map((l) => ({ id: l.id, title: l.title, best: lessonsDone?.[l.id]?.best ?? null }));
  const quiz = attempts.filter((a) => a.kind === 'quiz' && a.topic === 'all' && (a.total ?? 0) >= RULES.quizMin).sort((a, b) => b.score - a.score)[0] ?? null;
  const drillRegions = [...new Set(attempts.filter((a) => a.kind === 'drill' && a.score >= RULES.drillPass).map((a) => a.region))];
  const expert = missionScores.filter((m) => m.difficulty === 'expert' && m.score >= RULES.distinctionScore).length;
  const criteria = [
    { id: 'lessons', label: `Every lesson check passed (${RULES.lessonPass}% or more)`, done: lessonScores.filter((l) => l.best >= RULES.lessonPass).length, of: lessonScores.length },
    { id: 'missions', label: `Every mission scored ${RULES.missionPass} or more`, done: missionScores.filter((m) => m.score >= RULES.missionPass).length, of: missionScores.length },
    { id: 'quiz', label: `A mixed quiz round of ${RULES.quizMin} or more questions scored ${RULES.quizPass}% or more`, done: quiz && quiz.score >= RULES.quizPass ? 1 : 0, of: 1 },
    { id: 'drills', label: `Classification drills passed (${RULES.drillPass}% or more) in ${RULES.drillRegions} regions`, done: Math.min(drillRegions.length, RULES.drillRegions), of: RULES.drillRegions },
  ];
  const eligible = criteria.every((c) => c.done >= c.of);
  return { criteria, eligible, missionScores, lessonScores, quiz, drillRegions, expertCount: expert, distinction: eligible && expert >= RULES.distinctionMissions };
}

export function verificationCode({ name, userId, status, date }) {
  const basis = JSON.stringify({ app: 'variations-classifier', name: name.trim(), userId, date, missions: status.missionScores.map((m) => [m.id, m.score]), quiz: status.quiz?.score ?? null });
  const h = sha256(basis).toUpperCase();
  return `VC-${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}`;
}
