import { Priority } from '@prisma/client';
import { addDays, addWeeks, startOfDay } from 'date-fns';

export interface ParsedTodo {
  title: string;
  priority?: Priority;
  dueDate?: Date;
  projectName?: string;
  tags?: string[];
}

/**
 * Parse natural language input to extract todo metadata
 *
 * Syntax:
 * - Priority: !urgent, !high, !medium, !low
 * - Due dates: today, tomorrow, next week, Jan 15, Monday, 15th
 * - Project: @project-name
 * - Tags: #tag1 #tag2
 *
 * Example: "Buy milk tomorrow #shopping !high @personal"
 * Returns: { title: "Buy milk", dueDate: Date(tomorrow), tags: ["shopping"], priority: "HIGH", projectName: "personal" }
 */
export function parseNaturalLanguage(input: string): ParsedTodo {
  let text = input.trim();
  const result: ParsedTodo = {
    title: '',
  };

  // Extract priority (e.g., !urgent, !high, !medium, !low)
  const priorityMatch = text.match(/!(urgent|high|medium|low)\b/i);
  if (priorityMatch) {
    const priorityText = priorityMatch[1].toUpperCase() as Priority;
    result.priority = priorityText;
    text = text.replace(priorityMatch[0], '').trim();
  }

  // Extract project (e.g., @project-name)
  const projectMatch = text.match(/@([\w-]+)/);
  if (projectMatch) {
    result.projectName = projectMatch[1];
    text = text.replace(projectMatch[0], '').trim();
  }

  // Extract tags (e.g., #tag1 #tag2)
  const tagMatches = text.matchAll(/#([\w-]+)/g);
  const tags: string[] = [];
  for (const match of tagMatches) {
    tags.push(match[1]);
    text = text.replace(match[0], '').trim();
  }
  if (tags.length > 0) {
    result.tags = tags;
  }

  // Extract due date
  const dueDate = parseDueDate(text);
  if (dueDate) {
    result.dueDate = dueDate.date;
    text = text.replace(dueDate.matched, '').trim();
  }

  // Clean up extra whitespace
  text = text.replace(/\s+/g, ' ').trim();

  result.title = text;

  return result;
}

interface DateMatch {
  date: Date;
  matched: string;
}

function parseDueDate(text: string): DateMatch | null {
  const now = new Date();
  const today = startOfDay(now);

  // Relative dates
  const relativePatterns = [
    { pattern: /\btoday\b/i, date: today },
    { pattern: /\btomorrow\b/i, date: addDays(today, 1) },
    { pattern: /\bnext week\b/i, date: addWeeks(today, 1) },
    {
      pattern: /\bin (\d+) days?\b/i,
      getDays: (match: RegExpMatchArray) => addDays(today, parseInt(match[1])),
    },
    {
      pattern: /\bin (\d+) weeks?\b/i,
      getDays: (match: RegExpMatchArray) => addWeeks(today, parseInt(match[1])),
    },
  ];

  for (const { pattern, date, getDays } of relativePatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        date: getDays ? getDays(match) : date!,
        matched: match[0],
      };
    }
  }

  // Day of week (e.g., Monday, Tuesday)
  const dayOfWeekMatch = text.match(
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
  );
  if (dayOfWeekMatch) {
    const targetDay = dayOfWeekMatch[1].toLowerCase();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayIndex = days.indexOf(targetDay);
    const currentDayIndex = now.getDay();

    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Next week
    }

    return {
      date: addDays(today, daysToAdd),
      matched: dayOfWeekMatch[0],
    };
  }

  // Ordinal dates (e.g., 15th, 1st, 22nd)
  const ordinalMatch = text.match(/\b(\d{1,2})(st|nd|rd|th)\b/i);
  if (ordinalMatch) {
    const day = parseInt(ordinalMatch[1]);
    const targetDate = new Date(now.getFullYear(), now.getMonth(), day);

    // If the date is in the past, assume next month
    if (targetDate < now) {
      targetDate.setMonth(targetDate.getMonth() + 1);
    }

    return {
      date: startOfDay(targetDate),
      matched: ordinalMatch[0],
    };
  }

  // Month + Day (e.g., Jan 15, January 15, 1/15, 01-15)
  const monthDayPatterns = [
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})\b/i,
    /\b(\d{1,2})[\/\-](\d{1,2})\b/,
  ];

  for (const pattern of monthDayPatterns) {
    const match = text.match(pattern);
    if (match) {
      let month: number, day: number;

      if (pattern.source.includes('jan')) {
        // Month name format
        const monthMap: Record<string, number> = {
          jan: 0,
          feb: 1,
          mar: 2,
          apr: 3,
          may: 4,
          jun: 5,
          jul: 6,
          aug: 7,
          sep: 8,
          oct: 9,
          nov: 10,
          dec: 11,
        };
        month = monthMap[match[1].toLowerCase().substring(0, 3)];
        day = parseInt(match[2]);
      } else {
        // Numeric format (M/D or M-D)
        month = parseInt(match[1]) - 1; // 0-indexed
        day = parseInt(match[2]);
      }

      const targetDate = new Date(now.getFullYear(), month, day);

      // If the date is in the past, assume next year
      if (targetDate < now) {
        targetDate.setFullYear(targetDate.getFullYear() + 1);
      }

      return {
        date: startOfDay(targetDate),
        matched: match[0],
      };
    }
  }

  return null;
}

/**
 * Format parsed result for display
 */
export function formatParsedPreview(parsed: ParsedTodo): string {
  const parts: string[] = [];

  if (parsed.dueDate) {
    const dateStr = parsed.dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: parsed.dueDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
    parts.push(`Due: ${dateStr}`);
  }

  if (parsed.priority) {
    parts.push(`Priority: ${parsed.priority.charAt(0) + parsed.priority.slice(1).toLowerCase()}`);
  }

  if (parsed.projectName) {
    parts.push(`Project: ${parsed.projectName}`);
  }

  if (parsed.tags && parsed.tags.length > 0) {
    parts.push(`Tags: ${parsed.tags.map(t => `#${t}`).join(', ')}`);
  }

  return parts.join(' | ');
}
