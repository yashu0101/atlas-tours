// Admin panel stylesheet. Everything is scoped under .adm-root (set on the admin page wrapper),
// themed through --a-* variables; dark values apply when <html data-theme="dark"> (site theme toggle).
// Contrast of every text/background pair below was checked against WCAG AA.
export default function AdminStyles() {
  return (
    <style>{`
.adm-root{
  --a-bg:#F3F4F7;--a-surface:#FFFFFF;--a-surface-2:#F8F9FB;--a-border:#E2E5EB;--a-border-strong:#C9CFDA;
  --a-text:#1B2130;--a-muted:#5D6678;--a-accent:#E67E22;--a-accent-hover:#D06E16;--a-accent-text:#A9520B;
  --a-accent-soft:#FFF3E6;--a-on-accent:#0A1628;--a-shadow:0 1px 2px rgba(20,28,45,.06),0 4px 16px rgba(20,28,45,.05);
  --a-side:#1A2132;--a-side-2:#262D3D;--a-side-text:#AEB6C7;--a-side-strong:#FFFFFF;--a-side-accent:#F2A35E;
  --a-ok-bg:#E7F6EC;--a-ok:#1E7A45;--a-warn-bg:#FFF5DC;--a-warn:#9A6200;--a-info-bg:#E8F1FC;--a-info:#1F5FA8;
  --a-bad-bg:#FDECEA;--a-bad:#B42318;--a-neutral-bg:#EEF0F4;--a-neutral:#4E5768;--a-violet-bg:#F1EAFB;--a-violet:#6B3FA0;
  min-height:100vh;background:var(--a-bg);color:var(--a-text);font-family:var(--font-poppins),'Poppins',sans-serif;
  font-size:14px;line-height:1.5;color-scheme:light;
}
[data-theme="dark"] .adm-root{
  --a-bg:#10141F;--a-surface:#161B28;--a-surface-2:#1B2131;--a-border:#262D3D;--a-border-strong:#343C4F;
  --a-text:#E8EAF0;--a-muted:#97A1B4;--a-accent-text:#F0A15C;--a-accent-soft:rgba(230,126,34,.12);
  --a-shadow:0 1px 2px rgba(0,0,0,.3);--a-side:#0B0F18;--a-side-2:#1A2132;
  --a-ok-bg:#16302A;--a-ok:#6FD39A;--a-warn-bg:#352B15;--a-warn:#F2C46D;--a-info-bg:#182A44;--a-info:#8DBCF2;
  --a-bad-bg:#3A1C1C;--a-bad:#F59A93;--a-neutral-bg:#262D3D;--a-neutral:#AEB6C7;--a-violet-bg:#2B2140;--a-violet:#C9AEF0;
  color-scheme:dark;
}
.adm-root *,.adm-root *::before,.adm-root *::after{box-sizing:border-box}
.adm-root h1,.adm-root h2,.adm-root h3,.adm-root h4,.adm-root p{margin:0}
.adm-root button{font:inherit}
.adm-root .tnum{font-variant-numeric:tabular-nums}

/* ---------- Shell ---------- */
.adm-shell{display:grid;grid-template-columns:248px minmax(0,1fr);min-height:100vh}
.adm-side{background:var(--a-side);color:var(--a-side-text);position:sticky;top:0;height:100vh;display:flex;flex-direction:column;padding:20px 14px}
.adm-brand{display:flex;align-items:center;gap:12px;padding:4px 8px 22px}
.adm-brand img{width:40px;height:40px;border-radius:10px;object-fit:cover}
.adm-brand h1{font-size:.95rem;font-weight:600;color:var(--a-side-strong);line-height:1.25}
.adm-brand h1 span{display:block;font-size:.75rem;font-weight:400;color:var(--a-side-accent)}
.adm-nav{display:flex;flex-direction:column;gap:2px;flex:1;overflow-y:auto}
.adm-nav-group{font-size:.75rem;color:var(--a-side-text);opacity:.8;padding:18px 12px 6px}
.adm-nav-item{display:flex;align-items:center;gap:12px;width:100%;padding:9px 12px;border:0;border-radius:8px;background:none;
  color:var(--a-side-text);cursor:pointer;text-align:left;font-size:.875rem;position:relative;transition:background .15s,color .15s}
.adm-nav-item:hover{background:var(--a-side-2);color:var(--a-side-strong)}
.adm-nav-item.active{background:var(--a-side-2);color:var(--a-side-strong);font-weight:500}
.adm-nav-item.active::before{content:"";position:absolute;left:-14px;top:8px;bottom:8px;width:3px;border-radius:0 3px 3px 0;background:var(--a-accent)}
.adm-nav-item.active svg{color:var(--a-side-accent)}
.adm-nav-count{margin-left:auto;min-width:22px;padding:1px 7px;border-radius:999px;background:var(--a-accent);color:var(--a-on-accent);font-size:.72rem;font-weight:600;text-align:center}
.adm-side-foot{display:flex;flex-direction:column;gap:2px;border-top:1px solid var(--a-side-2);padding-top:12px;margin-top:12px}
.adm-side-foot a.adm-nav-item{text-decoration:none}
.adm-main{min-width:0}
.adm-body{max-width:1240px;margin:0 auto;padding:32px 40px 64px}

/* ---------- Page header ---------- */
.adm-page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:24px}
.adm-page-head h2{font-size:1.5rem;font-weight:600;letter-spacing:-.01em;color:var(--a-text)}
.adm-page-head p{color:var(--a-muted);font-size:.875rem;margin-top:2px}
.adm-page-actions{display:flex;gap:8px;flex-wrap:wrap}
.adm-section-title{font-size:1rem;font-weight:600;margin:0 0 12px}

/* ---------- Buttons & inputs ---------- */
.adm-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:7px 14px;border:1px solid var(--a-border-strong);
  background:var(--a-surface);color:var(--a-text);border-radius:8px;cursor:pointer;font-size:.8125rem;font-weight:500;white-space:nowrap;
  transition:background .15s,border-color .15s,color .15s}
.adm-btn:hover{border-color:var(--a-accent);color:var(--a-accent-text)}
.adm-btn.primary{background:var(--a-accent);border-color:var(--a-accent);color:var(--a-on-accent);font-weight:600}
.adm-btn.primary:hover{background:var(--a-accent-hover);border-color:var(--a-accent-hover);color:var(--a-on-accent)}
.adm-btn.danger{color:var(--a-bad);border-color:var(--a-border-strong)}
.adm-btn.danger:hover{background:var(--a-bad-bg);border-color:var(--a-bad);color:var(--a-bad)}
.adm-btn.ghost{background:none;border-color:transparent}
.adm-btn.ghost:hover{background:var(--a-surface-2);border-color:var(--a-border)}
.adm-btn:disabled,.adm-btn:disabled:hover{opacity:.5;cursor:not-allowed;background:var(--a-surface);border-color:var(--a-border-strong);color:var(--a-muted)}
.adm-btn.primary:disabled{background:var(--a-accent);border-color:var(--a-accent);color:var(--a-on-accent)}
.adm-input,.adm-form input,.adm-form textarea,.adm-form select{width:100%;padding:9px 12px;background:var(--a-surface);border:1px solid var(--a-border-strong);
  border-radius:8px;color:var(--a-text);font:inherit;font-size:.875rem;transition:border-color .15s,box-shadow .15s}
.adm-input:focus,.adm-form input:focus,.adm-form textarea:focus,.adm-form select:focus{outline:none;border-color:var(--a-accent);box-shadow:0 0 0 3px var(--a-accent-soft)}
.adm-input:focus-visible,.adm-form input:focus-visible,.adm-form textarea:focus-visible,.adm-form select:focus-visible{outline:2px solid var(--a-accent);outline-offset:1px}

/* Status selects in tables: tinted by their current value */
select.adm-sel{appearance:none;-webkit-appearance:none;padding:4px 26px 4px 10px;border-radius:999px;border:1px solid transparent;font:inherit;font-size:.78rem;font-weight:600;cursor:pointer;
  background:var(--a-neutral-bg) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23888' stroke-width='1.5'/%3E%3C/svg%3E") no-repeat right 10px center;color:var(--a-neutral)}
select.adm-sel option{background:var(--a-surface);color:var(--a-text)}
select.adm-sel[data-value="paid"],select.adm-sel[data-value="confirmed"],select.adm-sel[data-value="completed"]{background-color:var(--a-ok-bg);color:var(--a-ok)}
select.adm-sel[data-value="pending"]{background-color:var(--a-warn-bg);color:var(--a-warn)}
select.adm-sel[data-value="new"]{background-color:var(--a-info-bg);color:var(--a-info)}
select.adm-sel[data-value="contacted"]{background-color:var(--a-accent-soft);color:var(--a-accent-text)}
select.adm-sel[data-value="cancelled"],select.adm-sel[data-value="failed"]{background-color:var(--a-bad-bg);color:var(--a-bad)}
select.adm-sel:hover{border-color:var(--a-border-strong)}

/* ---------- Badges ---------- */
.badge{display:inline-flex;align-items:center;gap:6px;padding:2px 10px;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.6;background:var(--a-neutral-bg);color:var(--a-neutral);white-space:nowrap;text-transform:capitalize}
.badge::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.badge-paid,.badge-confirmed,.badge-completed,.badge-active{background:var(--a-ok-bg);color:var(--a-ok)}
.badge-pending{background:var(--a-warn-bg);color:var(--a-warn)}
.badge-new,.badge-kind-trip-plan{background:var(--a-info-bg);color:var(--a-info)}
.badge-contacted,.badge-kind-callback{background:var(--a-accent-soft);color:var(--a-accent-text)}
.badge-cancelled,.badge-failed{background:var(--a-bad-bg);color:var(--a-bad)}
.badge-customer{background:var(--a-violet-bg);color:var(--a-violet)}
.badge-kind-trip-plan::before,.badge-kind-callback::before,.badge-kind-contact::before,.badge-customer::before{display:none}

/* ---------- Dashboard ---------- */
.adm-attn{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:16px;margin-bottom:28px}
.stat-card.attn{display:flex;flex-direction:column;align-items:flex-start;gap:4px;width:100%;text-align:left;cursor:pointer;
  background:var(--a-surface);border:1px solid var(--a-border);border-left:4px solid var(--a-accent);border-radius:12px;padding:18px 20px;box-shadow:var(--a-shadow);
  color:var(--a-text);transition:border-color .15s,transform .15s}
.stat-card.attn:hover{border-color:var(--a-accent)}
.stat-card.attn .num{font-size:2.25rem;font-weight:700;line-height:1.1;color:var(--a-text);font-variant-numeric:tabular-nums}
.stat-card.attn .lbl{font-size:.875rem;font-weight:500}
.stat-card.attn .hint{display:flex;align-items:center;gap:4px;font-size:.78rem;color:var(--a-accent-text);margin-top:6px}
.stat-card.attn.is-zero{border-left-color:var(--a-border-strong);box-shadow:none}
.stat-card.attn.is-zero .num{color:var(--a-muted)}
.stat-card.attn.is-zero .hint{color:var(--a-muted)}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(150px,100%),1fr));background:var(--a-surface);border:1px solid var(--a-border);border-radius:12px;margin-bottom:28px;overflow:hidden}
.stat-grid .stat-card{padding:18px 20px;border-right:1px solid var(--a-border)}
.stat-grid .stat-card:last-child{border-right:0}
.stat-grid .num{font-size:1.4rem;font-weight:600;font-variant-numeric:tabular-nums}
.stat-grid .lbl{font-size:.8125rem;color:var(--a-muted)}
.adm-split{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr));gap:20px}
.adm-panel{background:var(--a-surface);border:1px solid var(--a-border);border-radius:12px;overflow:hidden}
.adm-panel-head{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--a-border)}
.adm-panel-head h3{font-size:.95rem;font-weight:600}
.adm-panel .adm-table-wrap{border:0;border-radius:0}

/* ---------- Tables ---------- */
.adm-table-wrap{overflow-x:auto;background:var(--a-surface);border:1px solid var(--a-border);border-radius:12px}
.adm-table{width:100%;border-collapse:collapse;font-size:.8125rem}
.adm-table th{text-align:left;padding:11px 14px;color:var(--a-muted);font-weight:500;font-size:.78rem;background:var(--a-surface-2);border-bottom:1px solid var(--a-border);white-space:nowrap}
.adm-table td{padding:12px 14px;border-bottom:1px solid var(--a-border);vertical-align:top}
.adm-table tbody tr:last-child td{border-bottom:0}
.adm-table tbody tr:hover td{background:var(--a-surface-2)}
.adm-sub{display:block;font-size:.75rem;color:var(--a-muted)}
.adm-table td strong{white-space:nowrap}
.adm-table td:last-child{white-space:nowrap}
.adm-actions-stack{display:flex;flex-direction:column;align-items:stretch;gap:6px}
/* Wide tables (Bookings): tighter cells and wrapping names so every column fits on a laptop screen. */
.adm-table.compact th,.adm-table.compact td{padding-left:10px;padding-right:10px}
.adm-table.compact td strong{white-space:normal}
.adm-ref{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.8rem;font-weight:600;color:var(--a-accent-text)}
.adm-detail-row td{background:var(--a-surface-2)}
.adm-message{white-space:pre-wrap;word-break:break-word;font-size:.85rem;line-height:1.65;color:var(--a-text);max-width:72ch}

/* ---------- Filters & chips ---------- */
.adm-filters{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin-bottom:16px}
.adm-field{display:flex;flex-direction:column;gap:4px;font-size:.75rem;font-weight:500;color:var(--a-muted)}
.adm-search{flex:1 1 280px}
.adm-field .adm-input{padding:8px 11px;font-size:.8125rem}
.adm-pager{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px;font-size:.8125rem;color:var(--a-muted)}
.adm-chips{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:20px;padding:4px;background:var(--a-surface);border:1px solid var(--a-border);border-radius:10px;width:fit-content;max-width:100%}
.adm-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:0;background:none;color:var(--a-muted);border-radius:7px;cursor:pointer;font-size:.8125rem;font-weight:500}
.adm-chip:hover{color:var(--a-text)}
.adm-chip.active{background:var(--a-accent-soft);color:var(--a-accent-text)}
.adm-chip-count{min-width:20px;padding:0 6px;border-radius:999px;background:var(--a-neutral-bg);color:var(--a-neutral);font-size:.72rem;text-align:center}

/* ---------- Content lists ---------- */
.adm-list{display:flex;flex-direction:column;gap:10px}
.adm-card{background:var(--a-surface);border:1px solid var(--a-border);border-radius:12px;padding:18px 20px}
.adm-row{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap}
.adm-row-main{flex:1;min-width:240px}
.adm-row-title{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:.95rem;font-weight:600;color:var(--a-text);margin-bottom:4px}
.adm-row-text{color:var(--a-muted);font-size:.85rem;max-width:80ch}
.adm-row-meta{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:8px;font-size:.78rem;color:var(--a-muted)}
.adm-row-meta strong{color:var(--a-text);font-weight:500}
.adm-row-actions{display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap}
.adm-quote{font-style:italic;white-space:pre-wrap}
.adm-stars{color:var(--a-accent);letter-spacing:1px;font-size:.9rem}
.adm-order{display:inline-grid;place-items:center;min-width:28px;height:24px;padding:0 6px;border-radius:6px;background:var(--a-neutral-bg);color:var(--a-neutral);font-size:.75rem;font-weight:600}
.adm-hi{margin-top:6px;font-size:.82rem;color:var(--a-accent-text)}
.adm-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-weight:600;color:var(--a-text);background:var(--a-surface-2);border:1px dashed var(--a-border-strong);border-radius:6px;padding:1px 8px}
.pkg-card{display:flex;gap:18px;align-items:center;background:var(--a-surface);border:1px solid var(--a-border);border-radius:12px;padding:12px;padding-right:18px}
.pkg-card img{width:132px;height:88px;object-fit:cover;border-radius:8px;flex-shrink:0;background:var(--a-surface-2)}
.pkg-card.is-hidden img{filter:grayscale(1);opacity:.6}
.pkg-info{flex:1;min-width:0}
.pkg-info h4{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 4px;font-size:.95rem;font-weight:600}
.pkg-price{font-size:1rem;font-weight:600;font-variant-numeric:tabular-nums}
.pkg-price s{font-weight:400;font-size:.8rem;color:var(--a-muted);margin-left:6px}
.pkg-actions{display:flex;gap:6px;flex-shrink:0}
.adm-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(240px,100%),1fr));gap:16px}
.adm-gallery .adm-card{padding:0;overflow:hidden;display:flex;flex-direction:column}
.adm-gallery img{width:100%;aspect-ratio:3/2;object-fit:cover;display:block;background:var(--a-surface-2)}
.adm-gallery .adm-card.is-hidden img{filter:grayscale(1);opacity:.6}
.adm-gallery-body{padding:14px 16px;display:flex;flex-direction:column;gap:8px;flex:1}
.adm-gallery-body .adm-row-actions{margin-top:auto}
.adm-empty{text-align:center;color:var(--a-muted);padding:48px 20px;background:var(--a-surface);border:1px dashed var(--a-border-strong);border-radius:12px}

/* ---------- Modal & forms ---------- */
.modal-overlay{position:fixed;inset:0;background:rgba(10,14,24,.55);backdrop-filter:blur(2px);display:grid;place-items:center;z-index:100;padding:20px;overflow-y:auto}
.modal-content{position:relative;background:var(--a-surface);border:1px solid var(--a-border);border-radius:14px;width:100%;max-width:720px;max-height:calc(100vh - 40px);overflow-y:auto;
  box-shadow:0 20px 60px rgba(0,0,0,.25);animation:adm-pop .18s ease-out}
.modal-content:focus{outline:none}
@keyframes adm-pop{from{opacity:0;transform:translateY(8px) scale(.99)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.modal-content{animation:none}}
.modal-close{position:absolute;top:14px;right:14px;z-index:2}
.modal-title{font-size:1.15rem;font-weight:600;padding:22px 64px 18px 28px;border-bottom:1px solid var(--a-border)}
.adm-form{display:grid;grid-template-columns:1fr 1fr;gap:16px 18px;padding:22px 28px}
.adm-form .full{grid-column:1/-1}
.adm-fl{display:flex;flex-direction:column;gap:6px;font-size:.8125rem;font-weight:500;color:var(--a-text)}
.adm-form textarea{min-height:72px;resize:vertical;line-height:1.55}
.adm-check-cell{display:flex;align-items:flex-end;padding-bottom:9px}
.adm-check{display:inline-flex;gap:8px;align-items:center;font-size:.875rem;cursor:pointer}
.adm-form input[type="checkbox"]{width:16px;height:16px;padding:0;accent-color:var(--a-accent);box-shadow:none}
.adm-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.adm-section-label{font-size:.875rem;font-weight:600;color:var(--a-text);display:flex;flex-direction:column;gap:2px}
.adm-section-label small{font-size:.78rem;font-weight:400;color:var(--a-muted)}
.adm-pricing-empty{border:1px dashed var(--a-border-strong);border-radius:10px;padding:14px 16px;color:var(--a-muted);font-size:.8125rem;display:flex;flex-direction:column;gap:10px}
.adm-pricing{display:flex;flex-direction:column;gap:10px}
.adm-pricing-scroll{overflow-x:auto;border:1px solid var(--a-border);border-radius:10px;background:var(--a-surface-2)}
.adm-pricing-table{border-collapse:collapse;width:100%;font-size:.78rem}
.adm-pricing-table th{font-weight:500;color:var(--a-muted);text-align:left;padding:8px 6px;white-space:nowrap;border-bottom:1px solid var(--a-border)}
.adm-pricing-table td{padding:5px 4px}
.adm-form .adm-pricing-table input{padding:6px 8px;min-width:76px;font-size:.8125rem}
.adm-form .adm-pricing-table .adm-pricing-name input{min-width:130px}
.adm-pricing-name{padding-left:8px!important}
.adm-pricing-col{display:flex;align-items:center;gap:4px}
.adm-form .adm-pricing-col input{min-width:0;width:58px}
.adm-pricing-actions{white-space:nowrap}
.adm-pricing-x{border:1px solid var(--a-border-strong);background:var(--a-surface);color:var(--a-muted);border-radius:6px;width:24px;height:24px;cursor:pointer;font-size:.85rem;line-height:1;padding:0;margin-left:2px}
.adm-pricing-x:hover:not(:disabled){border-color:var(--a-accent);color:var(--a-accent-text)}
.adm-pricing-x:disabled{opacity:.4;cursor:not-allowed}
.adm-pricing-tools{display:flex;flex-wrap:wrap;gap:8px}
.adm-pricing-help{font-size:.78rem;color:var(--a-muted);line-height:1.5}
.adm-inline-btn{align-self:flex-start;border:none;background:none;color:var(--a-accent-text);font-size:.78rem;cursor:pointer;padding:0;text-decoration:underline}
.adm-preview{padding:0 28px}
.adm-preview img{max-width:220px;max-height:130px;object-fit:cover;border-radius:8px;border:1px solid var(--a-border)}
.adm-actions{display:flex;flex-direction:row-reverse;justify-content:flex-start;gap:8px;padding:16px 28px;border-top:1px solid var(--a-border);
  background:var(--a-surface-2);position:sticky;bottom:0}
.adm-actions .adm-btn{padding:9px 18px}

/* ---------- Loading ---------- */
.adm-loading{display:grid;place-items:center;min-height:100vh;gap:16px;align-content:center;color:var(--a-muted)}
.adm-spinner{width:28px;height:28px;border-radius:50%;border:3px solid var(--a-border);border-top-color:var(--a-accent);animation:adm-spin .8s linear infinite}
@keyframes adm-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.adm-spinner{animation-duration:2.4s}}

/* ---------- Responsive ---------- */
@media (max-width:960px){
  .adm-shell{grid-template-columns:minmax(0,1fr)}
  .adm-side{position:sticky;top:0;z-index:20;height:auto;flex-direction:row;flex-wrap:wrap;align-items:center;padding:10px 12px;gap:8px}
  .adm-brand{padding:0;flex:1;min-width:0}
  .adm-brand h1{font-size:.875rem}
  .adm-brand img{width:34px;height:34px}
  .adm-side-foot{flex-direction:row;border:0;margin:0;padding:0}
  .adm-side-foot .adm-nav-item{padding:8px}
  .adm-side-foot .adm-nav-label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
  .adm-nav{order:3;flex:1 0 100%;flex-direction:row;overflow-x:auto;gap:4px;padding-bottom:2px;scrollbar-width:none}
  .adm-nav-group{display:none}
  .adm-nav-item{width:auto;flex-shrink:0;padding:7px 12px}
  .adm-nav-item.active::before{left:12px;right:12px;top:auto;bottom:0;width:auto;height:3px;border-radius:3px 3px 0 0}
  .adm-body{padding:24px 16px 48px}
  .adm-split{grid-template-columns:1fr}
}
@media (max-width:640px){
  .adm-form{grid-template-columns:1fr;padding:18px}
  .modal-title{padding:18px 56px 14px 18px}
  .adm-actions{padding:14px 18px}
  .adm-preview{padding:0 18px}
  .modal-overlay{padding:0;align-items:end}
  .modal-content{border-radius:14px 14px 0 0;max-height:92vh}
  .pkg-card{flex-wrap:wrap;padding:12px}
  .pkg-card img{width:100%;height:150px}
  .pkg-info{flex:1 1 100%}
  .adm-field{flex:1 1 calc(50% - 12px);min-width:0}
  .adm-search{flex-basis:100%}
  .stat-grid .stat-card{border-right:0;border-bottom:1px solid var(--a-border)}
  .adm-page-head h2{font-size:1.3rem}
  /* Tables become one card per row: "Label   value" lines (labels come from data-label). */
  .adm-table.stack thead{display:none}
  .adm-table.stack,.adm-table.stack tbody,.adm-table.stack tr,.adm-table.stack td{display:block;width:100%}
  .adm-table.stack tr{padding:12px 16px;border-bottom:1px solid var(--a-border)}
  .adm-table.stack tbody tr:last-child{border-bottom:0}
  .adm-table.stack td{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:5px 0;border:0;text-align:right;max-width:none!important;white-space:normal!important}
  .adm-table.stack td::before{content:attr(data-label);flex-shrink:0;color:var(--a-muted);font-size:.75rem;text-align:left;padding-top:2px}
  .adm-table.stack td[data-label=""]::before{display:none}
  .adm-table.stack td[data-label=""]{justify-content:flex-end;padding-top:10px}
  .adm-table.stack td .adm-sub{display:block}
  .adm-table.stack tbody tr:hover td{background:none}
  .adm-table.stack .adm-detail-row td{display:block;text-align:left}
  .adm-table-wrap:has(.stack){overflow:visible}
}
      `}</style>
  );
}
