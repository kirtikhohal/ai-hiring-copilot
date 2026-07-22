import { scoreBand } from "@/lib/candidates";

// README: conic-gradient(<band color> <deg>, #ece7de 0) with a white inner
// circle showing the score in band color. deg = score/100 * 360.
// `size` = outer diameter; inner circle sizing scales from the 34px/26px spec.
export default function ScoreRing({ score, size = 34 }) {
  const band = scoreBand(score);
  const deg = (score / 100) * 360;
  const innerSize = Math.round(size * (26 / 34));
  const fontSize = Math.max(10, Math.round(size * (13 / 34)));

  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${band.color} ${deg}deg, #e8eaf4 0)`,
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white font-extrabold"
        style={{ width: innerSize, height: innerSize, fontSize, color: band.color }}
      >
        {score}
      </div>
    </div>
  );
}
