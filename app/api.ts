const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://passkit.hramos.dev";

export type PassData = {
  serial: string;
  customer_id: string;
  phone: string;
  name: string;
  clubs: string;
  full_clubs: string;
  photo_url: string;
  locations: Location[];
  created_at: string;
  updated_at: string;
};

export type Location = {
  latitude: number;
  longitude: number;
  relevant_text: string;
};

export async function listPasses(): Promise<PassData[]> {
  const res = await fetch(`${API_URL}/admin/passes`);
  return res.json();
}

export async function createPass(data: Omit<PassData, "created_at" | "updated_at">): Promise<{ serial: string; download_url: string }> {
  const res = await fetch(`${API_URL}/admin/passes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updatePass(serial: string, data: Partial<PassData>): Promise<void> {
  const res = await fetch(`${API_URL}/admin/passes/${serial}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function pushToSerial(serial: string): Promise<{ pushed: number; failed: number }> {
  const res = await fetch(`${API_URL}/admin/push/${serial}`, { method: "POST" });
  return res.json();
}
