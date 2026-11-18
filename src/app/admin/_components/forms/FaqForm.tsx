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
    // Native validation: required fields block Save and show the browser message; Enter saves.
    <form onSubmit={e => e.preventDefault()}>
      <h3 className="modal-title">{faq ? "Edit FAQ" : "New FAQ"}</h3>
      <div className="adm-form">
        <label className="adm-fl full"><span>Question (English) *</span><input required value={question} onChange={e => setQuestion(e.target.value)} placeholder="e.g. What is included in the tour package?" /></label>
        <label className="adm-fl full"><span>Question (Hindi)</span><input value={questionHi} onChange={e => setQuestionHi(e.target.value)} placeholder="Hindi translation (optional)" /></label>
        <label className="adm-fl full"><span>Answer (English) *</span><textarea required value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Answer to the question..." /></label>
        <label className="adm-fl full"><span>Answer (Hindi)</span><textarea value={answerHi} onChange={e => setAnswerHi(e.target.value)} placeholder="Hindi translation (optional)" /></label>
        <label className="adm-fl"><span>Order</span><input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} /></label>
        <div className="adm-check-cell">
          <label className="adm-check"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active</label>
        </div>
      </div>
      <div className="adm-actions">
        <button type="submit" className="adm-btn primary" onClick={() => question.trim() && answer.trim() && onSave({ question: question.trim(), questionHi: questionHi || undefined, answer: answer.trim(), answerHi: answerHi || undefined, active, order })}>Save</button>
        <button type="button" className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
