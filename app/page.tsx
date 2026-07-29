"use client";

import { useEffect, useState } from "react";
import { listPasses, createPass, updatePass, pushToSerial, type PassData, type Location } from "./api";

export default function Dashboard() {
  const [passes, setPasses] = useState<PassData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PassData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPasses = async () => {
    setLoading(true);
    setPasses(await listPasses());
    setLoading(false);
  };

  useEffect(() => { fetchPasses(); }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">PKPass Dashboard</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
        >
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

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : passes.length === 0 ? (
        <p className="text-gray-500 text-sm">No passes yet.</p>
      ) : (
        <PassTable
          passes={passes}
          onEdit={(p) => { setEditing(p); setShowForm(true); }}
        />
      )}
    </main>
  );
}

function PassTable({ passes, onEdit }: { passes: PassData[]; onEdit: (p: PassData) => void }) {
  const [pushing, setPushing] = useState<string | null>(null);

  const handlePush = async (serial: string) => {
    setPushing(serial);
    const result = await pushToSerial(serial);
    alert(`Pushed: ${result.pushed}, Failed: ${result.failed}`);
    setPushing(null);
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://passkit.hramos.dev";

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left text-gray-600">
          <tr>
            <th className="px-4 py-3 font-medium">Photo</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Customer ID</th>
            <th className="px-4 py-3 font-medium">Serial</th>
            <th className="px-4 py-3 font-medium">Locations</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {passes.map((p) => (
            <tr key={p.serial} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                {p.photo_url ? (
                  <img src={p.photo_url} alt="" className="w-10 h-10 rounded object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-200" />
                )}
              </td>
              <td className="px-4 py-3 font-medium">{p.name}</td>
              <td className="px-4 py-3 text-gray-500">{p.customer_id}</td>
              <td className="px-4 py-3 font-mono text-gray-500">{p.serial}</td>
              <td className="px-4 py-3 text-gray-500">{p.locations?.length || 0}</td>
              <td className="px-4 py-3 text-right space-x-2">
                <a
                  href={`${apiUrl}/pass/${p.serial}.pkpass`}
                  className="text-blue-600 hover:underline text-xs"
                  target="_blank"
                >
                  Download
                </a>
                <button onClick={() => onEdit(p)} className="text-gray-600 hover:text-gray-900 text-xs">
                  Edit
                </button>
                <button
                  onClick={() => handlePush(p.serial)}
                  disabled={pushing === p.serial}
                  className="text-green-600 hover:text-green-800 text-xs disabled:opacity-50"
                >
                  {pushing === p.serial ? "Pushing..." : "Push"}
                </button>
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
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{initial ? "Edit Pass" : "New Pass"}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">Close</button>
      </div>

      {downloadUrl && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
          Pass created!{" "}
          <a href={downloadUrl} className="text-blue-600 underline" target="_blank">{downloadUrl}</a>
        </div>
      )}

      {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <Field label="Serial" value={serial} onChange={setSerial} disabled={!!initial} placeholder="e.g. 1001" />
        <Field label="Customer ID" value={customerId} onChange={setCustomerId} disabled={!!initial} placeholder="e.g. 42" />
        <Field label="Phone" value={phone} onChange={setPhone} placeholder="+965-12345678" />
        <Field label="Name" value={name} onChange={setName} placeholder="First\nLast" />
        <Field label="Clubs" value={clubs} onChange={setClubs} className="col-span-2" placeholder="Club A • Club B" />
        <Field label="Full Clubs (back)" value={fullClubs} onChange={setFullClubs} className="col-span-2" placeholder="Club A • Club B • Club C" />
        <Field label="Photo URL" value={photoUrl} onChange={setPhotoUrl} className="col-span-2" placeholder="https://cdn.v-thru.com/..." />

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Locations (JSON)</label>
          <textarea
            value={locationsJson}
            onChange={(e) => setLocationsJson(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : initial ? "Update & Push" : "Create Pass"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, disabled, placeholder, className }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
      />
    </div>
  );
}
