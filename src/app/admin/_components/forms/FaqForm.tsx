import { useState } from "react";

import type { FAQ } from "@/lib/types";

export default function FaqForm({ faq, onSave, onCancel }: { faq?: FAQ; onSave: (f: Omit<FAQ, "id" | "createdAt">) => void; onCancel: () => void }) {
  const [question, setQuestion] = useState(faq?.question || "");
  const [questionHi, setQuestionHi] = useState(faq?.questionHi || "");
  const [answer, setAnswer] = useState(faq?.answer || "");
  const [answerHi, setAnswerHi] = useState(faq?.answerHi || "");
  const [active, setActive] = useState(faq?.active ?? true);
  const [order, setOrder] = useState(faq?.order ?? 0);

  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontWeight: 600, color: "#E67E22" }}>{faq ? "Edit FAQ" : "New FAQ"}</h3>
      <div className="adm-form">
        <div className="full"><label>Question (English) *</label><input value={question} onChange={e => setQuestion(e.target.value)} placeholder="e.g. What is included in the tour package?" /></div>
        <div className="full"><label>Question (Hindi)</label><input value={questionHi} onChange={e => setQuestionHi(e.target.value)} placeholder="Hindi translation (optional)" /></div>
        <div className="full"><label>Answer (English) *</label><textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Answer to the question..." /></div>
        <div className="full"><label>Answer (Hindi)</label><textarea value={answerHi} onChange={e => setAnswerHi(e.target.value)} placeholder="Hindi translation (optional)" /></div>
        <div><label>Order</label><input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 20 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active</label>
        </div>
      </div>
      <div className="adm-actions">
        <button className="adm-btn primary" onClick={() => question.trim() && answer.trim() && onSave({ question: question.trim(), questionHi: questionHi || undefined, answer: answer.trim(), answerHi: answerHi || undefined, active, order })}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
