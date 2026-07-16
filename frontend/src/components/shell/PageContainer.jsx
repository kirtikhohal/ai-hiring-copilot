import { cn } from "@/lib/utils";

// README §Spacing: content padding 36–44px top / 40px sides / 64px bottom;
// centered with margin: 0 auto. `width` picks the per-screen max-width.
const WIDTHS = {
  content: "max-w-content", // 1020px — dashboard
  wide: "max-w-content-wide", // 1020px — ranked / candidate
  form: "max-w-form", // 780px — jd / resumes / email
  prep: "max-w-prep", // 860px — prep
  summary: "max-w-summary", // 900px — interview summary
  profile: "max-w-profile", // 720px — profile / contact
};

export default function PageContainer({ width = "content", className, children }) {
  return (
    <div className="px-10 pb-16 pt-10">
      <div className={cn("mx-auto animate-fade-in", WIDTHS[width], className)}>
        {children}
      </div>
    </div>
  );
}
