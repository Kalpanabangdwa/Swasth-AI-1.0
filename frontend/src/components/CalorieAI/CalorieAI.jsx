// ─────────────────────────────────────────────────────────────
//  AI CALORIE ESTIMATOR — calls Swasth AI backend (/estimate-calories)
//  which uses Ollama (llama3.2) running locally
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";

const API_URL = "http://127.0.0.1:8000";
const AUTO_ESTIMATE_DELAY_MS = 1200;

export default function CalorieAI({ onAddEntry, hideLog = false } = {}) {
  const [fname, setFname]           = useState("");
  const [kcal, setKcal]             = useState("");
  const [estimating, setEstimating] = useState(false);
  const [aiNote, setAiNote]         = useState("");
  const [logs, setLogs]             = useState([]);
  const estimateInProgress          = useRef(false);

  /* ── Call backend /estimate-calories (uses Ollama) ── */
  const estimateCalories = async (foodName = fname) => {
    const name = (typeof foodName === "string" ? foodName : fname).trim();
    if (!name) return;
    if (estimateInProgress.current) return;
    estimateInProgress.current = true;
    setEstimating(true);
    setAiNote("");
    setKcal("");

    try {
      const res = await fetch(`${API_URL}/estimate-calories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food: name }),
      });

      if (!res.ok) {
        const err = await res.json();
        setAiNote(err.detail || "Estimation failed — please enter calories manually.");
        return;
      }

      const data = await res.json();

      if (data.calories && data.calories > 0) {
        setKcal(String(data.calories));
        setAiNote(`AI estimated ${data.calories} kcal for "${name}".`);
      } else {
        setAiNote("Could not estimate — please enter manually.");
      }
    } catch {
      setAiNote("Backend unavailable — please enter calories manually.");
    } finally {
      setEstimating(false);
      estimateInProgress.current = false;
    }
  };

  /* ── Auto-estimate when user stops typing ── */
  useEffect(() => {
    const trimmed = fname.trim();
    if (trimmed.length < 2) {
      setKcal("");
      setAiNote("");
      return;
    }
    const t = setTimeout(() => estimateCalories(trimmed), AUTO_ESTIMATE_DELAY_MS);
    return () => clearTimeout(t);
  }, [fname]);

  /* ── Add food entry ── */
  const addEntry = () => {
    if (!fname.trim() || !kcal || +kcal <= 0) return;
    const entry = { id: Date.now(), name: fname.trim(), kcal: +kcal };
    setLogs((prev) => [...prev, entry]);
    if (onAddEntry) onAddEntry(entry);
    setFname("");
    setKcal("");
    setAiNote("");
  };

  const deleteEntry = (id) => setLogs((prev) => prev.filter((e) => e.id !== id));
  const totalKcal = logs.reduce((sum, e) => sum + e.kcal, 0);

  /* ── Styles ── */
  const s = {
    wrap:     { maxWidth: 480, margin: "0 auto", fontFamily: "sans-serif", color: "#eaf6f0" },
    card:     { background: "#0a1e15", border: "1px solid rgba(0,220,130,.22)", borderRadius: 14, padding: "18px 16px", marginBottom: 14 },
    label:    { display: "block", fontSize: 11, fontWeight: 700, color: "#6aaa82", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 },
    input:    { width: "100%", background: "rgba(0,0,0,.3)", border: "1px solid rgba(0,220,130,.15)", borderRadius: 8, padding: "10px 12px", color: "#eaf6f0", fontSize: 14, outline: "none", boxSizing: "border-box" },
    row:      { display: "flex", gap: 8, alignItems: "flex-end" },
    btnAI:    { background: "rgba(0,220,130,.1)", border: "1px solid rgba(0,220,130,.3)", borderRadius: 8, padding: "10px 14px", color: "#00e08a", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" },
    btnAdd:   { background: "#00e08a", color: "#021008", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer" },
    note:     { background: "rgba(0,220,130,.06)", border: "1px solid rgba(0,220,130,.18)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#6aaa82", marginTop: 10 },
    logItem:  { display: "flex", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(0,220,130,.06)" },
    kcalBadge:{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "#00e08a", marginRight: 10 },
    delBtn:   { background: "none", border: "none", color: "#2d5440", cursor: "pointer", fontSize: 15, padding: "2px 4px" },
    total:    { textAlign: "right", fontSize: 13, fontWeight: 700, color: "#00e08a", marginTop: 8 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>🔥 Log Food</div>

        {/* Food name */}
        <div style={{ marginBottom: 12 }}>
          <label style={s.label}>Food / Meal Name</label>
          <input
            style={s.input}
            placeholder="e.g. 2 eggs with toast, 1 bowl dal rice…"
            value={fname}
            onChange={(e) => setFname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fname.trim() && kcal && addEntry()}
          />
        </div>

        {/* Calories */}
        <div style={{ marginBottom: 12 }}>
          <label style={s.label}>
            Calories (kcal)
            {estimating && <span style={{ color:"#00e08a", fontWeight:600, textTransform:"none", letterSpacing:"normal", marginLeft:6 }}>✨ AI calculating…</span>}
            {kcal && !estimating && <span style={{ color:"#00e08a", fontWeight:600, textTransform:"none", letterSpacing:"normal", marginLeft:6 }}>✨ Auto-filled by AI</span>}
          </label>
          <div style={s.row}>
            <input
              style={{ ...s.input, flex: 1 }}
              type="number" min="1" max="9999"
              placeholder={estimating ? "AI calculating…" : "Type food above — AI fills this automatically"}
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEntry()}
            />
            <button
              type="button"
              style={{ ...s.btnAI, opacity: !fname.trim() || estimating ? 0.5 : 1 }}
              onClick={() => estimateCalories()}
              disabled={!fname.trim() || estimating}
              title="Re-run AI estimate"
            >
              {estimating ? "…" : "🔄 Refresh"}
            </button>
          </div>
        </div>

        {aiNote && <div style={s.note}>💡 {aiNote}</div>}

        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:14 }}>
          <button
            style={{ ...s.btnAdd, opacity: !fname.trim() || !kcal || +kcal <= 0 ? 0.45 : 1, cursor: !fname.trim() || !kcal || +kcal <= 0 ? "not-allowed" : "pointer" }}
            onClick={addEntry}
            disabled={!fname.trim() || !kcal || +kcal <= 0}
          >
            Add
          </button>
        </div>
      </div>

      {/* Today's log */}
      {!hideLog && logs.length > 0 && (
        <div style={s.card}>
          <label style={s.label}>Today's Log</label>
          {logs.map((item) => (
            <div key={item.id} style={s.logItem}>
              <span style={{ fontSize:13 }}>{item.name}</span>
              <span style={s.kcalBadge}>{item.kcal} kcal</span>
              <button style={s.delBtn} onClick={() => deleteEntry(item.id)}>🗑</button>
            </div>
          ))}
          <div style={s.total}>Total: {totalKcal.toLocaleString()} kcal</div>
        </div>
      )}
    </div>
  );
}