"use client";

import { useState } from "react";

const BLUE = "#1A28FF";
const CREAM = "#F2EDE4";

type Temperature = "hot" | "iced";

interface CartItem {
  cartId: string;
  name: string;
  displayName: string;
  temperature?: Temperature;
  price: number;
  quantity: number;
}

interface MenuItem {
  id: string;
  name: string;
  modifier?: string;
  description?: string;
  hasTemperature: boolean;
  hotPrice?: number;
  icedPrice?: number;
  fixedPrice?: number;
}

const MENU: MenuItem[] = [
  { id: "americano", name: "Amecicano", hasTemperature: true, hotPrice: 8, icedPrice: 9 },
  { id: "latte", name: "Latte", hasTemperature: true, hotPrice: 12, icedPrice: 13 },
  { id: "affogato", name: "Affogato", description: "Double espresso w/ ice cream", hasTemperature: false, fixedPrice: 15 },
  { id: "matcha-latte", name: "Matcha", modifier: "Latte", hasTemperature: true, hotPrice: 13, icedPrice: 14 },
  { id: "matcha-strawberry", name: "Matcha", modifier: "Strawberry", hasTemperature: true, hotPrice: 13, icedPrice: 14 },
];

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [charged, setCharged] = useState(false);

  const addToCart = (item: MenuItem, temp?: Temperature) => {
    const price = item.hasTemperature
      ? (temp === "hot" ? item.hotPrice! : item.icedPrice!)
      : item.fixedPrice!;

    const cartId = `${item.id}-${temp ?? "fixed"}`;
    const displayName = item.modifier ? `${item.name} ${item.modifier}` : item.name;

    setCart((prev) => {
      const existing = prev.find((c) => c.cartId === cartId);
      if (existing) {
        return prev.map((c) =>
          c.cartId === cartId ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { cartId, name: item.id, displayName, temperature: temp, price, quantity: 1 }];
    });
  };

  const updateQty = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.cartId === cartId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const itemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleCharge = () => {
    setCharged(true);
    setTimeout(() => {
      setCharged(false);
      clearCart();
    }, 1800);
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ fontFamily: "var(--font-geist-sans)" }}>
      {/* ── Menu Panel ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-y-auto" style={{ backgroundColor: CREAM }}>
        {/* Brand header */}
        <div className="px-10 pt-8 pb-2">
          <div className="flex items-start gap-1">
            <span
              className="text-[72px] leading-none font-black tracking-[-0.04em]"
              style={{ color: BLUE }}
            >
              nokonoko
            </span>
            <span className="mt-2 text-xl font-black" style={{ color: BLUE }}>
              ™
            </span>
          </div>
        </div>

        {/* Menu list */}
        <div className="flex-1 px-10">
          {MENU.map((item, i) => (
            <div key={item.id}>
              <div className="flex items-center justify-between py-5 gap-6">
                {/* Item name */}
                <div className="flex-1 min-w-0">
                  <div className="relative inline-block">
                    {item.modifier && (
                      <span
                        className="absolute -top-4 right-0 text-[13px] font-semibold leading-none"
                        style={{ color: BLUE }}
                      >
                        {item.modifier}
                      </span>
                    )}
                    <span
                      className="block text-[64px] leading-none font-black tracking-[-0.03em]"
                      style={{ color: BLUE }}
                    >
                      {item.name}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm font-medium" style={{ color: BLUE }}>
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Add buttons */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {item.hasTemperature ? (
                    <>
                      <span className="text-xs font-semibold" style={{ color: BLUE }}>
                        Hot / Iced
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addToCart(item, "hot")}
                          className="px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:opacity-80 active:scale-95"
                          style={{ backgroundColor: BLUE, color: CREAM }}
                        >
                          Hot&nbsp;&nbsp;RM{item.hotPrice}
                        </button>
                        <button
                          onClick={() => addToCart(item, "iced")}
                          className="px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:opacity-80 active:scale-95"
                          style={{
                            border: `2px solid ${BLUE}`,
                            color: BLUE,
                            backgroundColor: "transparent",
                          }}
                        >
                          Iced&nbsp;&nbsp;RM{item.icedPrice}
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      className="px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:opacity-80 active:scale-95 mt-4"
                      style={{ backgroundColor: BLUE, color: CREAM }}
                    >
                      RM{item.fixedPrice}
                    </button>
                  )}
                </div>
              </div>

              {/* Divider */}
              {i < MENU.length - 1 && (
                <div style={{ height: 1, backgroundColor: `${BLUE}30` }} />
              )}
            </div>
          ))}
        </div>

        <div className="pb-8" />
      </div>

      {/* ── Order Panel ───────────────────────────────────────────── */}
      <div
        className="flex w-[300px] shrink-0 flex-col border-l"
        style={{ backgroundColor: "#FAFAFA", borderColor: `${BLUE}18` }}
      >
        {/* Header */}
        <div className="px-6 py-6 border-b" style={{ borderColor: `${BLUE}18` }}>
          <h2
            className="text-2xl font-black tracking-tight leading-none"
            style={{ color: BLUE }}
          >
            Order
          </h2>
          <p className="mt-1 text-xs font-medium" style={{ color: `${BLUE}70` }}>
            {itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? "s" : ""}` : "Empty"}
          </p>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="mt-8 text-center">
              <p className="text-sm font-semibold" style={{ color: `${BLUE}40` }}>
                No items yet
              </p>
              <p className="mt-1 text-xs" style={{ color: `${BLUE}30` }}>
                Tap a drink to add
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.cartId} className="flex items-start gap-3">
                  {/* Qty controls */}
                  <div className="flex items-center gap-1 pt-0.5">
                    <button
                      onClick={() => updateQty(item.cartId, -1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold leading-none transition-all hover:opacity-70"
                      style={{ backgroundColor: `${BLUE}12`, color: BLUE }}
                    >
                      −
                    </button>
                    <span
                      className="w-5 text-center text-sm font-black"
                      style={{ color: BLUE }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.cartId, 1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold leading-none transition-all hover:opacity-70"
                      style={{ backgroundColor: `${BLUE}12`, color: BLUE }}
                    >
                      +
                    </button>
                  </div>

                  {/* Name & price */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight truncate" style={{ color: BLUE }}>
                      {item.displayName}
                    </p>
                    {item.temperature && (
                      <p className="text-xs font-medium capitalize" style={{ color: `${BLUE}60` }}>
                        {item.temperature}
                      </p>
                    )}
                  </div>

                  <span className="text-sm font-bold shrink-0" style={{ color: BLUE }}>
                    RM{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total + actions */}
        {cart.length > 0 && (
          <div
            className="px-6 py-6 border-t space-y-3"
            style={{ borderColor: `${BLUE}18` }}
          >
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: `${BLUE}60` }}>
                Total
              </span>
              <span
                className="text-3xl font-black tracking-tight leading-none"
                style={{ color: BLUE }}
              >
                RM{total}
              </span>
            </div>

            <button
              onClick={handleCharge}
              disabled={charged}
              className="w-full py-4 rounded-2xl text-base font-black tracking-tight transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-default"
              style={{ backgroundColor: BLUE, color: CREAM }}
            >
              {charged ? "✓  Order Complete" : `Charge  RM${total}`}
            </button>

            <button
              onClick={clearCart}
              className="w-full py-1.5 text-xs font-semibold transition-all hover:opacity-60"
              style={{ color: `${BLUE}50` }}
            >
              Clear order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
