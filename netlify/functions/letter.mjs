import { getStore } from "@netlify/blobs";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export default async (req) => {
  let store;
  try { store = getStore("confession"); }
  catch (e) { return json({ error: "blobs error: " + e.message }, 500); }

  if (req.method === "GET") {
    try {
      const data = await store.get("data", { type: "json" });
      if (data) return json(data);
      const oldLetter = (await store.get("letter")) ?? ""; // galing sa naunang version
      return json({ letter: oldLetter, her: "", me: "" });
    } catch (e) { return json({ letter: "", her: "", me: "" }); }
  }

  if (req.method === "POST") {
    const pass = Netlify.env.get("EDIT_PASS");
    let body;
    try { body = await req.json(); } catch { return json({ error: "bad request" }, 400); }
    if (!pass) return json({ error: "EDIT_PASS is not set (add it, then redeploy)" }, 500);
    if (body.pass !== pass) return json({ error: "wrong passcode" }, 401);
    const data = {
      letter: String(body.letter || "").slice(0, 6000),
      her: String(body.her || "").slice(0, 40),
      me: String(body.me || "").slice(0, 40),
    };
    try { await store.setJSON("data", data); }
    catch (e) { return json({ error: "save failed: " + e.message }, 500); }
    return json({ ok: true });
  }
  return json({ error: "method not allowed" }, 405);
};

export const config = { path: "/api/letter" };
