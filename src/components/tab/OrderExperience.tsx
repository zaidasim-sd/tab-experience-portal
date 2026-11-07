import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Coffee, LockKeyhole, Minus, Plus, RotateCcw, ShoppingBag } from "lucide-react";
import { shop } from "@/lib/api/shop.functions";
import type { ShopOrder, ShopProduct } from "@/lib/shop.server";
import { menu } from "./menuData";
import { TabLogo } from "./TabLogo";
import { CustomCursor } from "./CustomCursor";
import "./order.css";

type Result = { ok: boolean; error?: string; products?: ShopProduct[]; order?: ShopOrder | null; checkoutUrl?: string };
type Cart = Record<string, number>;
const money = (minor: number) => new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(minor / 100);
const cleanName = (name: string) => name.replace(/^TEST\s*-\s*/i, "");
const details = new Map(menu.flatMap(group => group.items.map(item => [item.name, { description: item.desc, group: group.title, signature: item.signature }] as const)));
const tabs = ["all", "coffee", "frappes", "the table", "signatures", "test item"];
const errors: Record<string, string> = {
  shop_unavailable: "Our ordering counter is taking a moment. Please try again shortly.",
  checkout_in_progress_or_unknown_recover_do_not_retry: "We’re checking an earlier payment request. Please keep this order and ask the café team to review it before trying another payment.",
  safepay_unavailable_or_unknown_result: "Safepay hasn’t responded yet. Your order is saved. Check its status before continuing.",
  product_unavailable: "Something in your bag is no longer available. Refresh the menu and try again.",
  no_tracker_recovery_required: "Your order is saved, but checkout hasn’t opened yet. Continue to Safepay when you’re ready.",
  order_session_missing: "This browser can’t find your order session. Return to the browser you used for checkout.",
};
async function call(data: Parameters<typeof shop>[0]["data"]): Promise<Result> {
  try { return await shop({ data }); } catch { return { ok: false, error: "shop_unavailable" }; }
}
function CupIllustration() {
  return <svg viewBox="0 0 300 210" fill="none" aria-hidden="true" className="order-cup">
    <ellipse cx="150" cy="174" rx="107" ry="15" fill="currentColor" opacity=".06" />
    <ellipse cx="150" cy="168" rx="101" ry="16" stroke="currentColor" strokeWidth="1.2" />
    <path d="M78 77h130l-9 65c-3 24-110 24-113 0L78 77Z" fill="var(--offwhite)" stroke="currentColor" strokeWidth="1.5" />
    <path d="M206 86c60-12 48 58-6 45M207 97c37-8 27 29-4 23" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="143" cy="77" rx="65" ry="16" fill="var(--cream)" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="143" cy="78" rx="55" ry="10" fill="currentColor" opacity=".82" />
    <path d="M134 76c-23-19 31-16 8 1-12-18 24-14 7 0" stroke="var(--cream)" strokeWidth="1.4" />
    <path d="M127 49c-18-17 11-22 1-39M151 48c-11-12 13-20 7-32M171 50c-8-8 7-15 5-24" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity=".45" />
    <text x="119" y="132" fill="currentColor" style={{ fontFamily: "var(--font-display)", fontSize: 29, fontStyle: "italic" }}>tab.</text>
    <path d="m45 76 5 5m-5 0 5-5m184 67 8 8m-8 0 8-8" stroke="currentColor" strokeWidth="1.1" />
  </svg>;
}
function Quantity({ name, quantity, change, disabled = false }: { name: string; quantity: number; change: (value: number) => void; disabled?: boolean }) {
  return <div className="order-quantity">
    <button type="button" disabled={disabled} onClick={() => change(quantity - 1)} aria-label={`Remove one ${name}`}><Minus size={13} /></button>
    <span aria-label={`${quantity} in bag`}>{quantity}</span>
    <button type="button" disabled={disabled || quantity >= 20} onClick={() => change(quantity + 1)} aria-label={`Add one ${name}`}><Plus size={13} /></button>
  </div>;
}
export function OrderExperience() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [returnKind, setReturnKind] = useState("");
  const [automaticDone, setAutomaticDone] = useState(false);
  const requestKey = useRef("");
  const locked = useRef(false);
  const receipt = useRef<HTMLElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; started.current = true;
    setReturnKind(new URLSearchParams(window.location.search).get("payment") || "");
    try {
      const saved = JSON.parse(localStorage.getItem("tab-bag") || "null");
      if (saved && saved.cart && typeof saved.cart === "object") {
        setCart(Object.fromEntries(Object.entries(saved.cart).filter(([id, qty]) => /^[a-z0-9-]{1,80}$/.test(id) && Number.isInteger(qty) && Number(qty) > 0 && Number(qty) <= 20)) as Cart);
        if (typeof saved.key === "string" && /^[a-f0-9-]{36}$/.test(saved.key)) requestKey.current = saved.key;
      }
    } catch { /* storage is optional */ }
    void Promise.all([call({ action: "products" }), call({ action: "current" })]).then(([catalogue, current]) => {
      if (catalogue.ok) setProducts(catalogue.products || []); else setError(errors.shop_unavailable);
      if (current.ok) setOrder(current.order || null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading && order && returnKind) receipt.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading, order?._id, returnKind]);

  useEffect(() => {
    if (!order || order.paymentStatus === "paid" || order.checkoutState !== "ready") return;
    let cancelled = false, timer: ReturnType<typeof setTimeout>; let attempts = 0;
    setAutomaticDone(false);
    const poll = async () => {
      const result = await call({ action: "refresh" });
      if (cancelled) return;
      if (result.ok && result.order) setOrder(result.order);
      if (result.order?.paymentStatus === "paid") { setError(""); try { localStorage.removeItem("tab-bag"); } catch { /* optional */ } return; }
      if (++attempts < 12) timer = setTimeout(poll, 5000); else setAutomaticDone(true);
    };
    timer = setTimeout(poll, 1500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [order?._id, order?.checkoutState, order?.paymentStatus === "paid"]);

  const update = (id: string, quantity: number) => {
    if (locked.current || order) return;
    const next = { ...cart }; if (quantity <= 0) delete next[id]; else next[id] = Math.min(20, quantity);
    setCart(next); requestKey.current = crypto.randomUUID();
    try { localStorage.setItem("tab-bag", JSON.stringify({ cart: next, key: requestKey.current })); } catch { /* optional */ }
    setError("");
  };
  const lines = products.filter(p => cart[p._id]).map(p => ({ productId: p._id, name: p.name, quantity: cart[p._id], unitPriceMinor: p.priceMinor }));
  const shownLines = order?.lines || lines;
  const total = order?.totalMinor ?? lines.reduce((sum, line) => sum + line.quantity * line.unitPriceMinor, 0);
  const count = shownLines.reduce((sum, line) => sum + line.quantity, 0);
  const paid = order?.paymentStatus === "paid";
  const run = async (work: () => Promise<void>) => {
    if (locked.current) return; locked.current = true; setBusy(true); setError("");
    try { await work(); } catch { setError(errors.shop_unavailable); }
    finally { locked.current = false; setBusy(false); }
  };
  const checkout = () => run(async () => {
    if (!order) {
      requestKey.current ||= crypto.randomUUID();
      try { localStorage.setItem("tab-bag", JSON.stringify({ cart, key: requestKey.current })); } catch { /* optional */ }
      const result = await call({ action: "create", key: requestKey.current, items: lines.map(l => ({ productId: l.productId, quantity: l.quantity })) });
      if (!result.ok || !result.order) { setError(errors[result.error || ""] || errors.shop_unavailable); return; }
      setOrder(result.order);
      // Show the server-calculated receipt before the customer explicitly continues.
      receipt.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const result = await call({ action: "checkout" });
    if (!result.ok || !result.checkoutUrl) {
      setError(errors[result.error || ""] || errors.shop_unavailable);
      const current = await call({ action: "current" }); if (current.ok && current.order) setOrder(current.order);
      return;
    }
    window.location.assign(result.checkoutUrl);
  });
  const refresh = () => run(async () => {
    const result = await call({ action: "refresh" });
    if (result.ok && result.order) { setOrder(result.order); if (result.order.paymentStatus === "paid") try { localStorage.removeItem("tab-bag"); } catch { /* optional */ } }
    else setError(errors[result.error || ""] || errors.shop_unavailable);
  });
  const reset = () => run(async () => {
    const result = await call({ action: "clear" });
    if (result.ok) { setOrder(null); setCart({}); setReturnKind(""); requestKey.current = ""; try { localStorage.removeItem("tab-bag"); } catch { /* optional */ } window.history.replaceState({}, "", "/order"); }
    else setError(errors.shop_unavailable);
  });
  const edit = () => run(async () => {
    const result = await call({ action: "clear" });
    if (result.ok) { setOrder(null); requestKey.current = crypto.randomUUID(); }
    else setError("Checkout has already started. Please check the existing order before making changes.");
  });
  const groupFor = (product: ShopProduct) => details.get(cleanName(product.name))?.group.toLowerCase() || "test item";
  const visible = products.filter(p => tab === "all" || groupFor(p) === tab);

  return <div className="order-page">
    <CustomCursor />
    <a className="order-skip" href="#order-menu">Skip to the menu</a>
    <header className="order-header">
      <a href="/" aria-label="tab. home"><TabLogo size={45} /></a>
      <a href="/#menu" className="order-home"><ArrowLeft size={15} /> back to the café</a>
      <span className="order-sandbox"><span /> sandbox tasting</span>
    </header>
    <main className="order-shell">
      <section className="order-intro">
        <div><p className="order-eyebrow">THE NEXT GOOD THING · TAB. KARACHI</p><h1>a little pause.<br /><em>a very good order.</em></h1><p className="order-intro-copy">Your usual, or something new.<br />Make yourself a little tab.</p></div>
        <div className="order-illustration"><CupIllustration /><span>made for slow moments.</span></div>
      </section>
      <div className="order-test-note"><span>JUST A TASTE</span><p>This is our test ordering counter. Sandbox payments only; no real charges or café orders.</p><span aria-hidden="true">✳</span></div>
      <div className="order-layout">
        <section id="order-menu" className="order-catalogue" aria-label="Order menu">
          <div className="order-section-heading"><span className="order-eyebrow">01 / THE MENU</span><span className="order-small-note">a little something for every mood.</span></div>
          <div className="order-tabs" aria-label="Menu categories">{tabs.map(t => <button type="button" key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>)}</div>
          {loading ? <div className="order-loading" role="status"><Coffee size={28} /><p>opening the menu…</p><span className="order-loading-line" /></div> : !products.length ? <div className="order-empty-menu"><Coffee size={36} strokeWidth={1} /><h2>a brief coffee break.</h2><p>We couldn’t open the ordering menu just now.<br />Your café is still right where you left it.</p><button type="button" className="order-outline" onClick={() => window.location.reload()}>try again <RotateCcw size={14} /></button></div> : <div className="order-products">{visible.map((p, i) => {
            const name = cleanName(p.name), info = details.get(name), quantity = cart[p._id] || 0;
            return <article className={`order-product${quantity ? " is-selected" : ""}`} key={p._id} style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}>
              <div className="order-product-top"><span>{groupFor(p)}</span>{info?.signature && <span className="order-signature">✳ house favourite</span>}</div>
              <h2>{name}</h2><p>{info?.description || "a small test item, for trying the checkout."}</p>
              <div className="order-product-bottom"><span className="order-price"><small>Rs.</small> {money(p.priceMinor)}</span>{quantity ? <Quantity name={name} quantity={quantity} change={q => update(p._id, q)} disabled={busy || !!order} /> : <button type="button" className="order-add" disabled={busy || !!order || lines.length >= 20} onClick={() => update(p._id, 1)} aria-label={`Add ${name} to bag`}><span>add</span><Plus size={15} /></button>}</div>
            </article>;
          })}</div>}
          <p className="order-menu-footnote">Good things, in good company. <span>✳</span> All prices in Pakistani rupees.</p>
        </section>
        <aside id="your-tab" className="order-receipt" ref={receipt} aria-label="Your order" aria-busy={busy}>
          <div className="order-receipt-inner">
            <div className="order-receipt-brand"><span>tab.</span><ShoppingBag size={20} strokeWidth={1} /></div>
            <p className="order-eyebrow">02 / YOUR LITTLE TAB</p><h2>{paid ? "a very good choice." : "something good\nis in the bag."}</h2>
            {order && <p className="order-reference">ORDER {order._id.slice(0, 8).toUpperCase()}</p>}
            {!count ? <div className="order-empty-bag"><Coffee size={36} strokeWidth={1} /><p>A little empty, for now.</p><span>Add something you love<br />and we’ll keep it right here.</span></div> : <ul className="order-line-list">{shownLines.map(line => <li key={line.productId}><div><span>{cleanName(line.name)}</span>{order ? <small>qty. {line.quantity}</small> : <Quantity name={cleanName(line.name)} quantity={line.quantity} change={q => update(line.productId, q)} disabled={busy} />}</div><span>{money(line.quantity * line.unitPriceMinor)}</span></li>)}</ul>}
            <div className="order-total"><span>your total <small>{count} {count === 1 ? "item" : "items"}</small></span><strong><small>Rs.</small> {money(total)}</strong></div>
            {order && <div className={`order-status${paid ? " is-paid" : ""}`} role="status" aria-live="polite">
              <span className="order-status-icon">{paid ? <Check size={18} /> : <Coffee size={18} />}</span>
              <div><strong>{paid ? "payment confirmed." : order.checkoutState === "creating" ? "checking your checkout." : order.paymentStatus === "failed" ? "that payment didn’t go through." : returnKind === "cancel" ? "your order is still here." : order.checkoutState === "new" ? "your tab is ready." : "waiting for confirmation."}</strong>
                <p>{paid ? "Your sandbox payment is complete. Thanks for trying a little tab." : order.checkoutState === "creating" ? "Keep this order. We need to verify the earlier request before another attempt." : order.checkoutState === "new" ? "We’ve checked your total. Continue to Safepay to make your test payment." : automaticDone ? "Still checking? Use the status button below. Please don’t start another payment if you’ve already paid." : "A return from checkout doesn’t confirm payment. We’ll check it directly with Safepay."}</p></div>
            </div>}
            {error && <p className="order-error" role="alert">{error}</p>}
            {paid ? <button className="order-primary" disabled={busy} type="button" onClick={reset}>another little tab <ArrowUpRight size={18} /></button> : <>
              <button className="order-primary" type="button" disabled={loading || busy || !count || order?.checkoutState === "creating"} onClick={checkout}>{busy ? "one little moment…" : !order ? "review your order" : order.paymentStatus === "failed" || returnKind === "cancel" ? "return to Safepay" : "continue to Safepay"}<ArrowUpRight size={18} /></button>
              {order?.checkoutState === "ready" && <button type="button" className="order-status-button" disabled={busy} onClick={refresh}><RotateCcw size={13} /> check payment status</button>}
              {order?.checkoutState === "new" && <button type="button" className="order-status-button" disabled={busy} onClick={edit}><ArrowLeft size={13} /> edit your bag</button>}
            </>}
            <p className="order-payment-note"><LockKeyhole size={12} /> {paid ? "sandbox payment · no real charge" : "secure checkout with Safepay"}</p>
            <div className="order-receipt-bottom"><span>A PLACE TO LAND.</span><span>A VERY GOOD COFFEE.</span></div>
          </div>
        </aside>
      </div>
      <footer className="order-footer"><span>small café. good company. tab.</span><a href="/">back to the café <ArrowUpRight size={14} /></a></footer>
    </main>
    {!!count && !paid && <a className="order-mobile-bag" href="#your-tab" onClick={e => { e.preventDefault(); receipt.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><span><ShoppingBag size={16} /> your tab · {count}</span><span>Rs. {money(total)} <ArrowUpRight size={16} /></span></a>}
  </div>;
}
