"use client";

import { useEffect, useState } from "react";
import { listPasses, createPass, updatePass, pushToSerial, type PassData, type Location } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://passkit.hramos.dev";

export default function Dashboard() {
  const [passes, setPasses] = useState<PassData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PassData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPasses = async () => {
    setLoading(true);
    try {
      setPasses(await listPasses());
    } catch {
      setPasses([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPasses(); }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">Passes</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {loading ? "Loading..." : `${passes.length} pass${passes.length !== 1 ? "es" : ""}`}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-slate-800"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2.5V9.5M2.5 6H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          New Pass
        </button>
      </div>

      {showForm && (
        <PassForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); fetchPasses(); }}
        />
      )}

      {!loading && passes.length === 0 && !showForm ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-[13px] text-slate-500">No passes yet</p>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="mt-3 text-[12px] font-medium text-slate-900 hover:text-slate-700"
          >
            Create your first pass
          </button>
        </div>
      ) : !loading && passes.length > 0 ? (
        <PassTable passes={passes} onEdit={(p) => { setEditing(p); setShowForm(true); }} />
      ) : null}
    </main>
  );
}

function PassTable({ passes, onEdit }: { passes: PassData[]; onEdit: (p: PassData) => void }) {
  const [pushing, setPushing] = useState<string | null>(null);

  const handlePush = async (serial: string) => {
    setPushing(serial);
    const result = await pushToSerial(serial);
    setPushing(null);
    alert(`Pushed: ${result.pushed}, Failed: ${result.failed}`);
  };

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-slate-100 text-left">
            <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">Photo</th>
            <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">Name</th>
            <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">Customer</th>
            <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">Serial</th>
            <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-400 text-center">Locations</th>
            <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-400 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {passes.map((p) => (
            <tr key={p.serial} className="transition-colors hover:bg-slate-50/50">
              <td className="px-4 py-3">
                {p.photo_url ? (
                  <img src={p.photo_url} alt="" className="h-8 w-8 rounded-md border border-slate-100 object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-md border border-slate-100 bg-slate-50" />
                )}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">{p.name.replace("\\n", " ")}</td>
              <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{p.customer_id}</td>
              <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{p.serial}</td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                  {p.locations?.length || 0}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-1">
                  <a
                    href={`${API_URL}/pass/${p.serial}`}
                    target="_blank"
                    className="rounded px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => onEdit(p)}
                    className="rounded px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handlePush(p.serial)}
                    disabled={pushing === p.serial}
                    className="rounded px-2 py-1 text-[11px] font-medium text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                  >
                    {pushing === p.serial ? "Sending..." : "Push"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PassForm({ initial, onClose, onSaved }: { initial: PassData | null; onClose: () => void; onSaved: () => void }) {
  const [serial, setSerial] = useState(initial?.serial || "");
  const [customerId, setCustomerId] = useState(initial?.customer_id || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [name, setName] = useState(initial?.name || "");
  const [clubs, setClubs] = useState(initial?.clubs || "");
  const [fullClubs, setFullClubs] = useState(initial?.full_clubs || "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photo_url || "");
  const [locationsJson, setLocationsJson] = useState(
    initial?.locations ? JSON.stringify(initial.locations, null, 2) : "[]"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    let locations: Location[];
    try {
      locations = JSON.parse(locationsJson);
    } catch {
      setError("Invalid locations JSON");
      setSaving(false);
      return;
    }

    try {
      if (initial) {
        await updatePass(initial.serial, { phone, name, clubs, full_clubs: fullClubs, photo_url: photoUrl, locations });
        await pushToSerial(initial.serial);
      } else {
        const result = await createPass({ serial, customer_id: customerId, phone, name, clubs, full_clubs: fullClubs, photo_url: photoUrl, locations });
        setDownloadUrl(result.download_url);
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 rounded-md border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h2 className="text-[13px] font-semibold text-slate-900">{initial ? "Edit Pass" : "New Pass"}</h2>
        <button onClick={onClose} className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div className="px-5 py-4">
        {downloadUrl && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] text-emerald-800">
            Pass created — <a href={downloadUrl} className="font-medium underline" target="_blank">{downloadUrl}</a>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <Field label="Serial" value={serial} onChange={setSerial} disabled={!!initial} placeholder="1001" mono />
          <Field label="Customer ID" value={customerId} onChange={setCustomerId} disabled={!!initial} placeholder="42" mono />
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="+965-12345678" />
          <Field label="Name" value={name} onChange={setName} placeholder="First Last" />
          <Field label="Clubs" value={clubs} onChange={setClubs} className="col-span-2" placeholder="Club A • Club B" />
          <Field label="Full Clubs (back)" value={fullClubs} onChange={setFullClubs} className="col-span-2" placeholder="Club A • Club B • Club C" />
          <Field label="Photo URL" value={photoUrl} onChange={setPhotoUrl} className="col-span-2" placeholder="https://cdn.v-thru.com/..." mono />

          <div className="col-span-2">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Locations (JSON)</label>
            <textarea
              value={locationsJson}
              onChange={(e) => setLocationsJson(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[12px] text-slate-700 transition-colors focus:border-slate-300 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="col-span-2 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
            >
              {saving ? "Saving..." : initial ? "Update & Push" : "Create Pass"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, disabled, placeholder, className, mono }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string; className?: string; mono?: boolean;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full rounded-md border border-slate-200 px-3 py-2 text-[13px] text-slate-900 transition-colors placeholder:text-slate-300 focus:border-slate-300 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 ${mono ? "font-mono text-[12px]" : ""}`}
      />
    </div>
  );
}
