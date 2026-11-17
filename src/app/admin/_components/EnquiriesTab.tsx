import type { Enquiry } from "@/lib/types";

import { ENQUIRY_STATUSES, isOneOf } from "../_lib/api";

export default function EnquiriesTab({ enquiries, onUpdateStatus, onRemove }: {
  enquiries: Enquiry[];
  onUpdateStatus: (id: string, status: Enquiry["status"]) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <h2 style={{ margin: "0 0 20px", fontWeight: 600, color: "#E67E22" }}>Enquiries</h2>
      <table className="adm-table">
        <thead><tr><th>Name</th><th>Contact</th><th>Travelers</th><th>Travel Date</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {enquiries.map(e => (
            <tr key={e.id}>
              <td><strong>{e.name}</strong></td>
              <td>{e.phone}<br /><span style={{ fontSize: ".75rem", color: "#8a8070" }}>{e.email}</span></td>
              <td>{e.travelers}</td>
              <td>{e.travelDate}</td>
              <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.message || "--"}</td>
              <td>
                <select className="adm-sel" value={e.status} onChange={ev => { const v = ev.target.value; if (isOneOf(ENQUIRY_STATUSES, v)) onUpdateStatus(e.id, v); }}>
                  <option value="new">New</option><option value="contacted">Contacted</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option>
                </select>
              </td>
              <td><button className="adm-btn danger" onClick={() => onRemove(e.id)}>Del</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {enquiries.length === 0 && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No enquiries yet.</p>}
    </div>
  );
}
