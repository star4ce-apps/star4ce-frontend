/**
 * Split candidate notes into interview blocks (same rules as profile parseProcessEvents).
 */
export function collectInterviewNoteBlocks(notes: string | null | undefined): string[] {
  if (!notes || !notes.trim()) return [];

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

  return interviewBlocks;
}

/**
 * Parse candidate notes to extract interview scores (one per interview block).
 * Must match profile parseProcessEvents() so list and profile stay aligned.
 * Prefer the "(NN/100)" total from the Total Weighted Score line; only fall back to the
 * simple category /10 average when that line is missing (unweighted, approximate).
 */
export function getInterviewScoresFromNotes(notes: string | null | undefined): number[] {
  if (!notes || !notes.trim()) return [];

  const scores: number[] = [];
  const interviewBlocks = collectInterviewNoteBlocks(notes);
  if (interviewBlocks.length === 0) return [];

  for (const block of interviewBlocks) {
    const normalizedBlock = block
      .replace(/(Interview Stage:)([^\n])/g, '$1\n$2')
      .replace(/(Hiring Manager:)([^\n])/g, '$1\n$2')
      .replace(/(Role:)([^\n])/g, '$1\n$2')
      .replace(/(Interviewer Recommendation:)([^\n])/g, '$1\n$2')
      .replace(/(Scores:)([^\n])/g, '$1\n$2')
      .replace(/(Additional Notes:)([^\n])/g, '$1\n$2');
    const lines = normalizedBlock.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    let totalScore = '';
    let inScoresSection = false;
    const categoryScores: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('Total Weighted Score:')) {
        let rest = line.replace('Total Weighted Score:', '').trim();
        if (!rest && i + 1 < lines.length) {
          rest = lines[i + 1].trim();
          i += 1;
        }
        totalScore = rest;
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

/** Highest "Interview Stage: N" found in notes (1–5), or 0 if none. */
export function getMaxCompletedInterviewStageFromNotes(notes: string | null | undefined): number {
  if (!notes?.trim()) return 0;
  let max = 0;
  const re = /Interview Stage:\s*(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(notes)) !== null) {
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 5) max = Math.max(max, n);
  }
  return max;
}

/**
 * How many interviews are "done" for progression: max of (block count, highest stage label).
 * Two appended blocks both labeled "Interview Stage: 1" still count as 2 completed interviews.
 */
export function getEffectiveCompletedInterviewMax(notes: string | null | undefined): number {
  const blocks = collectInterviewNoteBlocks(notes);
  if (blocks.length === 0) return 0;
  const maxLabel = getMaxCompletedInterviewStageFromNotes(notes);
  return Math.min(5, Math.max(blocks.length, maxLabel));
}

/**
 * Interview block for this stage: by order when labels are consistent with count (duplicate
 * "Interview Stage: 1" blocks map to pills 1 and 2), otherwise by matching `Interview Stage: N`.
 */
export function getInterviewNoteBlockForStage(
  notes: string | null | undefined,
  stageStr: string,
): string | null {
  const stageNum = parseInt(stageStr, 10);
  if (Number.isNaN(stageNum) || stageNum < 1 || stageNum > 5) return null;
  const blocks = collectInterviewNoteBlocks(notes);
  const blockCount = blocks.length;
  if (blockCount === 0) return null;
  const maxLabel = getMaxCompletedInterviewStageFromNotes(notes);
  const useOrdinal = maxLabel <= blockCount;
  if (useOrdinal && stageNum <= blockCount) return blocks[stageNum - 1] ?? null;
  const target = blocks.find((b) => new RegExp(`Interview Stage:\\s*${stageNum}\\b`).test(b));
  return target ?? null;
}

/** True if notes contain a scored block for this stage (see getInterviewNoteBlockForStage). */
export function isInterviewStageCompletedForUi(notes: string | null | undefined, stageNum: number): boolean {
  if (stageNum < 1 || stageNum > 5) return false;
  const b = getInterviewNoteBlockForStage(notes, String(stageNum));
  return Boolean(b?.trim());
}
