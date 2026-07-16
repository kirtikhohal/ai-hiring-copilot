import { useState } from "react";
import PageContainer from "@/components/shell/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { submitContact } from "@/lib/api";

const TOPICS = ["Product feedback", "Report a bug", "Billing", "Something else"];

const FIELD =
  "mt-2 w-full rounded-[11px] border-[1.5px] border-border-strong bg-white px-[13px] py-2.5 text-[14px] font-medium text-ink placeholder:text-ink-faint transition-shadow";
const LABEL = "text-[12.5px] font-bold text-ink-2";

export default function ContactUs() {
  const { user } = useAuth();
  const toast = useToast();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [email, setEmail] = useState(user?.email || "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email.trim() || !message.trim()) {
      toast.error("Missing details", "Please add your email and a message.");
      return;
    }
    setSending(true);
    try {
      const res = await submitContact({ topic, email, message });
      setMessage("");
      toast.success("Message sent", res.message || "We'll get back to you within a day.");
    } catch (err) {
      toast.error("Couldn't send", err.message || "Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <PageContainer width="profile">
      <h1 className="h1">Contact us</h1>
      <p className="mt-1.5 text-[14px] font-medium text-ink-2">
        Questions, feedback, or a bug? We usually reply within a day.
      </p>

      <Card className="mt-6 p-[22px]">
        <form onSubmit={submit}>
          <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
            <div>
              <div className={LABEL}>Topic</div>
              <select className={FIELD} value={topic} onChange={(e) => setTopic(e.target.value)}>
                {TOPICS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <div className={LABEL}>Your email</div>
              <input
                type="email"
                className={FIELD}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
          </div>
          <div className="mt-4">
            <div className={LABEL}>Message</div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind…"
              className={`${FIELD} h-[140px] resize-none leading-[1.6]`}
            />
          </div>
          <div className="mt-[18px] flex justify-end">
            <Button type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send message"}
            </Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
