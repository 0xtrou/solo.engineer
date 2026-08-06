import { SHARED_CATEGORIES, categoryShortLabels, maxScore, type Category } from "@/lib/categories";

type CategoryScoresProps = {
  scores: Record<Category, number>;
  testId: string;
  activeColor: string;
  mutedColor: string;
};

export function CategoryScores({ scores, testId, activeColor, mutedColor }: CategoryScoresProps) {
  const peak = maxScore(scores);
  if (peak === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-testid={testId}>
      {SHARED_CATEGORIES.map((category) => {
        const count = scores[category];
        const isActive = count === peak && peak > 0;
        return (
          <span
            key={category}
            className="font-mono text-[9px] tracking-wide"
            style={{ color: isActive ? activeColor : mutedColor }}
            title={`${category}: ${count} keyword hit${count === 1 ? "" : "s"}`}
          >
            {categoryShortLabels[category]} {count}
          </span>
        );
      })}
    </div>
  );
}
