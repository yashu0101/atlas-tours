// Admin panel stylesheet (scoped by the adm-*/pkg-*/stat-*/badge* class names it targets).
export default function AdminStyles() {
  return (
    <style>{`
        .adm-header{background:rgba(15,20,34,.97);border-bottom:1px solid rgba(230,126,34,.3);padding:0 32px;display:flex;align-items:center;justify-content:space-between;height:64px;position:sticky;top:0;z-index:10}
        .adm-header h1{font-family:Poppins,sans-serif;color:#E67E22;font-size:1.1rem;letter-spacing:.08em;font-weight:600;margin:0}
        .adm-tabs{display:flex;gap:0;background:#151b2e;border-bottom:1px solid #252d42;overflow-x:auto}
        .adm-tab{padding:14px 22px;cursor:pointer;border:none;background:none;color:#8a8070;font:inherit;font-size:.88rem;border-bottom:2px solid transparent;transition:all .2s;white-space:nowrap}
        .adm-tab:hover{color:#E67E22}
        .adm-tab.active{color:#E67E22;border-bottom-color:#E67E22;background:rgba(230,126,34,.06)}
        .adm-body{max-width:1280px;margin:0 auto;padding:32px}
        .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:32px}
        .stat-card{background:#1a2035;border:1px solid #252d42;border-radius:8px;padding:24px;text-align:center}
        .stat-card .num{font-weight:700;font-size:2rem;color:#E67E22;margin-bottom:4px}
        .stat-card .lbl{font-size:.85rem;color:#8a8070}
        .adm-table{width:100%;border-collapse:collapse;font-size:.88rem}
        .adm-table th{text-align:left;padding:12px 14px;color:#8a8070;font-weight:600;border-bottom:1px solid #252d42;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em}
        .adm-table td{padding:12px 14px;border-bottom:1px solid #1e2640}
        .adm-table tr:hover{background:rgba(230,126,34,.04)}
        .badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:.75rem;font-weight:600}
        .badge-paid,.badge-confirmed,.badge-completed{background:rgba(91,201,107,.15);color:#7ddf8a;border:1px solid rgba(91,201,107,.3)}
        .badge-pending{background:rgba(230,190,50,.15);color:#E2C68E;border:1px solid rgba(230,190,50,.3)}
        .badge-new{background:rgba(91,154,201,.15);color:#7db8df;border:1px solid rgba(91,154,201,.3)}
        .badge-contacted{background:rgba(230,126,34,.15);color:#E67E22;border:1px solid rgba(230,126,34,.3)}
        .badge-cancelled,.badge-failed{background:rgba(200,60,60,.15);color:#e77;border:1px solid rgba(200,60,60,.3)}
        .badge-refunded{background:rgba(140,140,140,.15);color:#aaa;border:1px solid rgba(140,140,140,.3)}
        .badge-active{background:rgba(91,201,107,.15);color:#7ddf8a;border:1px solid rgba(91,201,107,.3)}
        .badge-inactive,.badge-hidden{background:rgba(140,140,140,.15);color:#aaa;border:1px solid rgba(140,140,140,.3)}
        .adm-btn{padding:6px 14px;border:1px solid #323a50;background:none;color:#ADA394;border-radius:4px;cursor:pointer;font:inherit;font-size:.8rem;transition:all .2s}
        .adm-btn:hover{border-color:#E67E22;color:#E67E22}
        .adm-btn.primary{background:#E67E22;color:#fff;border-color:#E67E22}
        .adm-btn.primary:hover{background:#d2691e}
        .adm-btn.danger{border-color:#c44;color:#e77}
        .adm-btn.danger:hover{background:rgba(200,60,60,.15)}
        select.adm-sel{background:#1a2035;color:#EDE6DA;border:1px solid #323a50;padding:4px 8px;border-radius:4px;font:inherit;font-size:.8rem}
        .adm-card{background:#1a2035;border:1px solid #252d42;border-radius:8px;padding:24px;margin-bottom:16px}
        .adm-card h3{margin:0 0 12px;font-weight:600;color:#E67E22}
        .adm-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .adm-form .full{grid-column:1/-1}
        .adm-form label{display:block;font-size:.8rem;color:#8a8070;margin-bottom:4px}
        .adm-form input,.adm-form textarea,.adm-form select{width:100%;padding:10px 12px;background:#0f1422;border:1px solid #323a50;border-radius:4px;color:#EDE6DA;font:inherit;font-size:.88rem;box-sizing:border-box}
        .adm-form input:focus,.adm-form textarea:focus{outline:none;border-color:#E67E22}
        .adm-form textarea{min-height:60px;resize:vertical}
        .adm-actions{display:flex;gap:8px;margin-top:14px}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:grid;place-items:center;z-index:100;padding:20px;overflow-y:auto}
        .modal-content{background:#1a2035;border:1px solid #252d42;border-radius:10px;padding:32px;width:100%;max-width:700px;max-height:90vh;overflow-y:auto}
        .pkg-card{display:flex;gap:16px;align-items:center;background:#1a2035;border:1px solid #252d42;border-radius:8px;padding:16px;margin-bottom:12px}
        .pkg-card img{width:100px;height:70px;object-fit:cover;border-radius:4px;border:1px solid #323a50}
        .pkg-info{flex:1}
        .pkg-info h4{margin:0 0 4px;color:#EDE6DA;font-size:.95rem}
        .pkg-info p{margin:0;font-size:.82rem;color:#8a8070}
        .pkg-actions{display:flex;gap:6px;flex-shrink:0}
        .adm-btn:disabled{opacity:.45;cursor:not-allowed;border-color:#323a50;color:#8a8070}
        .adm-btn.primary:disabled{background:#E67E22;color:#fff;border-color:#E67E22}
        .adm-filters{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;background:#1a2035;border:1px solid #252d42;border-radius:8px;padding:16px;margin-bottom:16px}
        .adm-field{display:flex;flex-direction:column;gap:4px;font-size:.75rem;color:#8a8070;text-transform:uppercase;letter-spacing:.06em}
        .adm-search{flex:1 1 260px}
        .adm-input{background:#0f1422;color:#EDE6DA;border:1px solid #323a50;padding:7px 10px;border-radius:4px;font:inherit;font-size:.85rem;text-transform:none;letter-spacing:normal;color-scheme:dark;box-sizing:border-box}
        .adm-input:focus{outline:none;border-color:#E67E22}
        .adm-pager{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:16px;font-size:.85rem;color:#8a8070}
        .adm-ref{font-family:ui-monospace,Consolas,monospace;font-size:.82rem;color:#E2C68E;letter-spacing:.04em}
        .adm-detail-row td{background:#151b2e}
        .adm-message{white-space:pre-wrap;word-break:break-word;font-size:.85rem;line-height:1.6;color:#EDE6DA;max-width:900px}
        .badge-kind-contact{background:rgba(140,140,140,.15);color:#ccc;border:1px solid rgba(140,140,140,.3)}
        .badge-kind-trip-plan{background:rgba(91,154,201,.15);color:#7db8df;border:1px solid rgba(91,154,201,.3)}
        .badge-kind-callback{background:rgba(230,126,34,.15);color:#E67E22;border:1px solid rgba(230,126,34,.3)}
        .badge-customer{background:rgba(160,110,220,.15);color:#c4a3ef;border:1px solid rgba(160,110,220,.3)}
        .adm-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
        .adm-chip{padding:6px 14px;border:1px solid #323a50;background:none;color:#ADA394;border-radius:16px;cursor:pointer;font:inherit;font-size:.8rem;transition:all .2s}
        .adm-chip:hover{border-color:#E67E22;color:#E67E22}
        .adm-chip.active{background:rgba(230,126,34,.12);border-color:#E67E22;color:#E67E22}
        .adm-chip-count{display:inline-block;min-width:20px;margin-left:4px;padding:0 6px;border-radius:10px;background:#252d42;color:#EDE6DA;font-size:.72rem;text-align:center}
        @media(max-width:700px){
          .adm-filters{padding:12px;gap:10px}
          .adm-field{flex:1 1 calc(50% - 10px);min-width:0}
          .adm-search{flex-basis:100%}
          .adm-input{width:100%}
          .adm-tabs{overflow-x:auto;white-space:nowrap}
          .adm-body{padding:16px}
          .adm-table{font-size:.78rem}
          .adm-table th,.adm-table td{padding:8px 6px}
          .adm-form{grid-template-columns:1fr}
          .pkg-card{flex-direction:column;align-items:stretch}
          .modal-content{padding:20px}
        }
      `}</style>
  );
}
