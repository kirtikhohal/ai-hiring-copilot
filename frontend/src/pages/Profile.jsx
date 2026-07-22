import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/shell/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth, POSITIONS } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import UserAvatar from "@/components/ui/user-avatar";
import { inputClass, Label } from "@/components/auth/fields";

function Row({ label, value, last }) {
  return (
    <div
      className={`flex items-center justify-between py-[15px] ${
        last ? "" : "border-b border-hairline-2"
      }`}
    >
      <span className="text-[12.5px] font-bold text-ink-muted">{label}</span>
      <span className="text-[14px] font-bold text-ink">{value}</span>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, saveProfile, uploadAvatar, logout } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  async function onPickPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setPhotoBusy(true);
    setError("");
    try {
      await uploadAvatar(file);
      toast.success("Photo updated");
    } catch (err) {
      const msg = err.message || "Could not upload the photo.";
      setError(msg);
      toast.error("Upload failed", msg);
    } finally {
      setPhotoBusy(false);
    }
  }

  function startEdit() {
    setDraft(user);
    setError("");
    setEditing(true);
  }
  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await saveProfile(draft);
      setEditing(false);
      toast.success("Profile saved");
    } catch (e) {
      const msg = e.message || "Could not save your profile.";
      setError(msg);
      toast.error("Save failed", msg);
    } finally {
      setSaving(false);
    }
  }
  function signOut() {
    logout();
    navigate("/login");
  }

  return (
    <PageContainer width="profile">
      <h1 className="h1">Profile</h1>
      <p className="mt-1.5 text-[14px] font-medium text-ink-2">
        Your account details, visible to your team.
      </p>

      {/* Header card — gradient cover banner + overlapping avatar */}
      <Card className="mt-6 overflow-hidden p-0">
        <div className="h-[72px] bg-accent-gradient" />
        <div className="px-6 pb-[22px]">
          <div className="-mt-7 flex flex-wrap items-end gap-4">
            <div className="rounded-full border-4 border-white shadow-[0_4px_14px_rgba(20,22,31,.12)]">
              <UserAvatar user={user} size={76} />
            </div>
            <div className="min-w-[150px] flex-1 pb-1">
              <div className="text-[19px] font-extrabold tracking-tight2 text-ink">
                {user.fullName}
              </div>
              <div className="mt-0.5 text-[12.5px] font-medium text-ink-2">
                {user.position} · {user.org}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={onPickPhoto}
            />
            <Button
              variant="outline"
              size="sm"
              className="mb-1"
              disabled={photoBusy}
              onClick={() => fileInputRef.current?.click()}
            >
              {photoBusy ? "Uploading…" : "Change photo"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Shared error banner — covers photo-upload (view mode) and save (edit mode). */}
      {error && (
        <div className="mt-3.5 rounded-input border border-red-soft bg-red-soft px-3.5 py-2.5 text-[12.5px] font-medium text-red-text">
          {error}
        </div>
      )}

      {!editing ? (
        <>
          <Card className="mt-3.5 px-[22px] py-1">
            <Row label="Full name" value={user.fullName} />
            <Row label="Username" value={user.username} />
            <Row label="Email" value={user.email} />
            <Row label="Position in organization" value={user.position} />
            <Row label="Organization" value={user.org || "—"} />
            <Row label="Organization city" value={user.orgCity || "—"} />
            <Row label="Organization country" value={user.orgCountry || "—"} last />
          </Card>
          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={signOut}
              className="rounded-[11px] border px-[18px] py-[11px] text-[13.5px] font-bold"
              style={{ background: "#fff", color: "#e5484d", borderColor: "#f6d5d5" }}
            >
              Sign out
            </button>
            <Button onClick={startEdit}>Edit profile</Button>
          </div>
        </>
      ) : (
        <>
          <Card className="mt-3.5 p-[22px]">
            <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
              <div>
                <Label>Full name</Label>
                <input
                  className={inputClass}
                  value={draft.fullName}
                  onChange={set("fullName")}
                />
              </div>
              <div>
                <Label>Username</Label>
                <input
                  className={inputClass}
                  value={draft.username}
                  onChange={set("username")}
                />
              </div>
              <div>
                <Label>Email</Label>
                <input
                  className={inputClass}
                  value={draft.email}
                  onChange={set("email")}
                />
              </div>
              <div>
                <Label>Position in organization</Label>
                <select
                  className={inputClass}
                  value={draft.position}
                  onChange={set("position")}
                >
                  {POSITIONS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Organization</Label>
                <input
                  className={inputClass}
                  value={draft.org}
                  onChange={set("org")}
                />
              </div>
              <div>
                <Label>Organization city</Label>
                <input
                  className={inputClass}
                  value={draft.orgCity}
                  onChange={set("orgCity")}
                />
              </div>
              <div>
                <Label>Organization country</Label>
                <input
                  className={inputClass}
                  value={draft.orgCountry}
                  onChange={set("orgCountry")}
                />
              </div>
            </div>
          </Card>
          <div className="mt-5 flex justify-end gap-2.5">
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </>
      )}
    </PageContainer>
  );
}
