export type StatField = {
  key: string;
  label: string;
  aggregate: 'sum' | 'avg';
  decimals?: number;
};

export type DerivedField = {
  key: string;
  label: string;
  decimals: number;
  compute: (totals: Record<string, number>, games: number) => number;
};

export type QuickAction = {
  // Must match a statFields key — this is what gets incremented.
  key: string;
  label: string;
  value: number;
  // If set, this action also bumps the running team score by this amount.
  // Omit for stats that don't directly score (rebounds, assists, etc).
  scoreValue?: number;
};

export type SportTemplate = {
  statFields: StatField[];
  derivedFields?: DerivedField[];
  // Buttons for live, in-game entry. Sports without a real-time scoring
  // model (golf) just omit this — the live page falls back to a message
  // pointing back at the regular log-result form.
  quickActions?: QuickAction[];
  lowerScoreWins?: boolean;
};

export const sportTemplates: Record<string, SportTemplate> = {
  baseball: {
    statFields: [
      { key: 'ab', label: 'AB', aggregate: 'sum' },
      { key: 'hits', label: 'H', aggregate: 'sum' },
      { key: 'runs', label: 'R', aggregate: 'sum' },
      { key: 'rbi', label: 'RBI', aggregate: 'sum' },
      { key: 'hr', label: 'HR', aggregate: 'sum' },
    ],
    derivedFields: [
      {
        key: 'avg',
        label: 'AVG',
        decimals: 3,
        compute: (totals) => (totals.ab > 0 ? totals.hits / totals.ab : 0),
      },
    ],
    quickActions: [
      { key: 'ab', label: '+1 AB', value: 1 },
      { key: 'hits', label: '+1 H', value: 1 },
      { key: 'runs', label: '+1 R', value: 1, scoreValue: 1 },
      { key: 'rbi', label: '+1 RBI', value: 1 },
      { key: 'hr', label: '+1 HR', value: 1 },
    ],
  },
  softball: {
    statFields: [
      { key: 'ab', label: 'AB', aggregate: 'sum' },
      { key: 'hits', label: 'H', aggregate: 'sum' },
      { key: 'runs', label: 'R', aggregate: 'sum' },
      { key: 'rbi', label: 'RBI', aggregate: 'sum' },
    ],
    derivedFields: [
      {
        key: 'avg',
        label: 'AVG',
        decimals: 3,
        compute: (totals) => (totals.ab > 0 ? totals.hits / totals.ab : 0),
      },
    ],
    quickActions: [
      { key: 'ab', label: '+1 AB', value: 1 },
      { key: 'hits', label: '+1 H', value: 1 },
      { key: 'runs', label: '+1 R', value: 1, scoreValue: 1 },
      { key: 'rbi', label: '+1 RBI', value: 1 },
    ],
  },
  basketball: {
    statFields: [
      { key: 'points', label: 'PTS', aggregate: 'sum' },
      { key: 'rebounds', label: 'REB', aggregate: 'sum' },
      { key: 'assists', label: 'AST', aggregate: 'sum' },
      { key: 'steals', label: 'STL', aggregate: 'sum' },
    ],
    derivedFields: [
      {
        key: 'ppg',
        label: 'PPG',
        decimals: 1,
        compute: (totals, games) => (games > 0 ? totals.points / games : 0),
      },
    ],
    quickActions: [
      { key: 'points', label: '+1', value: 1, scoreValue: 1 },
      { key: 'points', label: '+2', value: 2, scoreValue: 2 },
      { key: 'points', label: '+3', value: 3, scoreValue: 3 },
      { key: 'rebounds', label: '+1 REB', value: 1 },
      { key: 'assists', label: '+1 AST', value: 1 },
      { key: 'steals', label: '+1 STL', value: 1 },
    ],
  },
  soccer: {
    statFields: [
      { key: 'goals', label: 'G', aggregate: 'sum' },
      { key: 'assists', label: 'A', aggregate: 'sum' },
      { key: 'shots', label: 'SH', aggregate: 'sum' },
      { key: 'saves', label: 'SV', aggregate: 'sum' },
    ],
    quickActions: [
      { key: 'goals', label: '+1 Goal', value: 1, scoreValue: 1 },
      { key: 'assists', label: '+1 Assist', value: 1 },
      { key: 'shots', label: '+1 Shot', value: 1 },
      { key: 'saves', label: '+1 Save', value: 1 },
    ],
  },
  football: {
    statFields: [
      { key: 'touchdowns', label: 'TD', aggregate: 'sum' },
      { key: 'passing_yards', label: 'PASS YDS', aggregate: 'sum' },
      { key: 'rushing_yards', label: 'RUSH YDS', aggregate: 'sum' },
      { key: 'tackles', label: 'TKL', aggregate: 'sum' },
    ],
    // Simplification: counts every TD as 6 — doesn't model extra points,
    // 2pt conversions, field goals, or safeties separately yet.
    quickActions: [
      { key: 'touchdowns', label: '+1 TD (6)', value: 1, scoreValue: 6 },
      { key: 'passing_yards', label: '+10 pass yds', value: 10 },
      { key: 'rushing_yards', label: '+10 rush yds', value: 10 },
      { key: 'tackles', label: '+1 TKL', value: 1 },
    ],
  },
  volleyball: {
    statFields: [
      { key: 'kills', label: 'K', aggregate: 'sum' },
      { key: 'aces', label: 'ACE', aggregate: 'sum' },
      { key: 'digs', label: 'DIG', aggregate: 'sum' },
      { key: 'blocks', label: 'BLK', aggregate: 'sum' },
    ],
    // Kills and aces both win the rally outright, so both score 1.
    // Digs and blocks don't always win the point, so left as tallies only.
    quickActions: [
      { key: 'kills', label: '+1 Kill', value: 1, scoreValue: 1 },
      { key: 'aces', label: '+1 Ace', value: 1, scoreValue: 1 },
      { key: 'digs', label: '+1 Dig', value: 1 },
      { key: 'blocks', label: '+1 Block', value: 1 },
    ],
  },
  golf: {
    // Per-round values entered after the fact — live tap-scoring doesn't
    // fit golf's model, so no quickActions here on purpose.
    statFields: [
      { key: 'strokes', label: 'STROKES', aggregate: 'avg', decimals: 1 },
      { key: 'to_par', label: 'TO PAR', aggregate: 'avg', decimals: 1 },
    ],
    lowerScoreWins: true,
  },
};

export function getSportTemplate(sport: string): SportTemplate {
  return sportTemplates[sport.toLowerCase()] ?? { statFields: [] };
}
