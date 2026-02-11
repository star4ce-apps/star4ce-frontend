/**
 * Parse candidate notes to extract interview scores (one per interview block).
 * Must match profile parseProcessEvents() exactly so list and profile show the same average.
 * Profile normalizes so "Total Weighted Score:" is on its own line (value on next line),
 * so totalScore is often empty and we use category average — we do the same here.
 */
export function getInterviewScoresFromNotes(notes: string | null | undefined): number[] {
  if (!notes || !notes.trim()) return [];

  const scores: number[] = [];
  const interviewBlocks: string[] = [];

  if (notes.includes('--- INTERVIEW ---')) {
    const parts = notes.split(/--- INTERVIEW ---/);
    parts.forEach((part) => {
      const trimmed = part.trim();
      if (trimmed && trimmed.includes('Interview Stage:')) {
        interviewBlocks.push(trimmed);
      }
    });
  }

  if (interviewBlocks.length === 0) {
    const stageMatches = [...notes.matchAll(/Interview Stage:/g)];
    if (stageMatches.length === 0) return [];
    if (stageMatches.length === 1) {
      interviewBlocks.push(notes);
    } else {
      for (let i = 0; i < stageMatches.length; i++) {
        const startIndex = stageMatches[i].index ?? 0;
        const endIndex =
          i < stageMatches.length - 1 ? (stageMatches[i + 1].index ?? notes.length) : notes.length;
        const block = notes.substring(startIndex, endIndex).trim();
        if (block && block.includes('Interview Stage:')) {
          interviewBlocks.push(block);
        }
      }
    }
  }

  for (const block of interviewBlocks) {
    // Same normalization as profile so "Total Weighted Score:" gets value on next line (then we ignore it and use category avg)
    const normalizedBlock = block
      .replace(/(Interview Stage:)([^\n])/g, '$1\n$2')
      .replace(/(Hiring Manager:)([^\n])/g, '$1\n$2')
      .replace(/(Role:)([^\n])/g, '$1\n$2')
      .replace(/(Interviewer Recommendation:)([^\n])/g, '$1\n$2')
      .replace(/(Scores:)([^\n])/g, '$1\n$2')
      .replace(/(Total Weighted Score:)([^\n])/g, '$1\n$2')
      .replace(/(Additional Notes:)([^\n])/g, '$1\n$2');
    const lines = normalizedBlock.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    let totalScore = '';
    let inScoresSection = false;
    const categoryScores: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('Total Weighted Score:')) {
        // Profile only takes same-line value; after normalization value is on next line so this is often ''
        totalScore = line.replace('Total Weighted Score:', '').trim();
      } else if (line === 'Scores:') {
        inScoresSection = true;
      } else if (line.startsWith('Additional Notes:')) {
        inScoresSection = false;
      } else if (inScoresSection && line.includes(':') && line.includes('/10')) {
        // Same category format as profile: "Category Name: score/10 (Weighted: X.XX)" or with Comments
        const lineForParsing = line.replace(/\s+Comments:.*$/, '');
        const match = lineForParsing.match(/^(.+?):\s*(\d+(?:\.\d+)?)\/10(?:\s*\(Weighted:\s*([\d.]+)\))?/);
        if (match) {
          categoryScores.push(parseFloat(match[2]));
        }
      }
    }

    let sumScore: number | undefined;
    if (totalScore) {
      const scoreMatch = totalScore.match(/\((\d+)\/100\)/);
      if (scoreMatch) {
        sumScore = parseInt(scoreMatch[1], 10);
      } else {
        const fallbackMatch = totalScore.match(/(\d+(?:\.\d+)?)\/10/);
        if (fallbackMatch) {
          sumScore = Math.round(parseFloat(fallbackMatch[1]) * 10);
        }
      }
    }
    if (sumScore === undefined && categoryScores.length > 0) {
      const total = categoryScores.reduce((a, b) => a + b, 0);
      sumScore = Math.round((total / categoryScores.length) * 10);
    }
    if (sumScore !== undefined) {
      scores.push(sumScore);
    }
  }

  return scores;
}

/** Average of all interview scores, or null if none. */
export function getAverageInterviewScore(notes: string | null | undefined): number | null {
  const scores = getInterviewScoresFromNotes(notes);
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
