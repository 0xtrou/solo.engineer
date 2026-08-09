import { CRYPTO_CATEGORIES, cryptoCategoryShortLabels, maxScore, type CryptoCategory } from "@/lib/crypto-categories";

type CryptoCategoryScoresProps = {
  scores: Record<CryptoCategory, number>;
  testId: string;
  activeColor: string;
  mutedColor: string;
};

export function CryptoCategoryScores({ scores, testId, activeColor, mutedColor }: CryptoCategoryScoresProps) {
  const peak = maxScore(scores);
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-testid={testId}>
      {CRYPTO_CATEGORIES.map((category) => {
        const count = scores[category];
        const isActive = count === peak && peak > 0;
        return (
          <span
            key={category}
            className="font-mono text-[9px] tracking-wide"
            style={{ color: isActive ? activeColor : mutedColor }}
            title={`${category}: ${count} keyword hit${count === 1 ? "" : "s"}`}
          >
            {cryptoCategoryShortLabels[category]} {count}
          </span>
        );
      })}
    </div>
  );
}
