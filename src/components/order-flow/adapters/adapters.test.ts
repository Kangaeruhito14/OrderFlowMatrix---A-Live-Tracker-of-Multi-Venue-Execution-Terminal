import { describe, it, expect } from "vitest";
import { binanceAdapter } from "./binance";
import { kucoinAdapter } from "./kucoin";
import { ADAPTERS, getAdapter, EXCHANGES } from "./index";
import type { StreamConfig } from "./types";

const cfg = (base = "BTC", quote = "USDT"): StreamConfig => ({
  exchange: "binance",
  base,
  quote,
  category: "spot",
});

describe("Binance adapter", () => {
  it("infers SELL when buyer is the maker (m === true)", () => {
    const raw = JSON.stringify({
      e: "trade",
      E: 1700000000000,
      s: "BTCUSDT",
      t: 12345,
      p: "63000.00",
      q: "0.001",
      T: 1700000000123,
      m: true,
    });
    const [t] = binanceAdapter.parseWsMessage(raw, cfg());
    expect(t.side).toBe("SELL");
    expect(t.price).toBe(63000);
    expect(t.qty).toBe(0.001);
    expect(t.time).toBe(1700000000123); // prefers trade time T over event time E
    expect(t.notional).toBeCloseTo(63, 6);
    expect(t.id).toBe("12345");
    expect(t.exchange).toBe("binance");
  });

  it("infers BUY when buyer is the taker (m === false)", () => {
    const raw = JSON.stringify({ t: 1, p: "100", q: "2", T: 1, m: false });
    const [t] = binanceAdapter.parseWsMessage(raw, cfg());
    expect(t.side).toBe("BUY");
    expect(t.notional).toBe(200);
  });

  it("unwraps the combined-stream envelope { stream, data }", () => {
    const raw = JSON.stringify({
      stream: "btcusdt@trade",
      data: { t: 9, p: "10", q: "1", T: 5, m: false },
    });
    const [t] = binanceAdapter.parseWsMessage(raw, cfg());
    expect(t.side).toBe("BUY");
    expect(t.price).toBe(10);
  });

  it("maps REST isBuyerMaker === true to SELL", () => {
    const raw = JSON.stringify([
      { id: 1, price: "63000", qty: "0.001", time: 1700000000000, isBuyerMaker: true },
    ]);
    const [t] = binanceAdapter.parseRestResponse(raw, cfg());
    expect(t.side).toBe("SELL");
    expect(t.id).toBe("1");
  });

  it("builds the lowercase trade-stream WS url and native symbol", () => {
    expect(binanceAdapter.toNativeSymbol("BTC", "USDT", "spot")).toBe("BTCUSDT");
    expect(binanceAdapter.wsUrl(cfg())).toBe(
      "wss://stream.binance.com:9443/ws/btcusdt@trade"
    );
  });

  it("drops trades with non-positive or missing fields", () => {
    expect(binanceAdapter.parseWsMessage(JSON.stringify({ p: "0", q: "1", m: true }), cfg())).toEqual([]);
    expect(binanceAdapter.parseWsMessage(JSON.stringify({ p: "1", q: "1" }), cfg())).toEqual([]); // no side
  });
});

describe("KuCoin adapter", () => {
  const kcfg: StreamConfig = { exchange: "kucoin", base: "BTC", quote: "USDT", category: "spot" };

  it("converts nanosecond timestamps to milliseconds", () => {
    const raw = JSON.stringify({
      code: "200000",
      data: [{ sequence: "123", price: "63000", size: "0.001", side: "buy", time: 1781767013457000000 }],
    });
    const [t] = kucoinAdapter.parseRestResponse(raw, kcfg);
    // Must be ms (not the raw ~1.78e18 nanoseconds), and a plausible epoch.
    expect(t.time).toBeLessThan(1e15);
    expect(t.time).toBeGreaterThan(1.5e12);
    expect(t.side).toBe("BUY");
    expect(t.price).toBe(63000);
  });

  it("maps side strings and uses the server proxy for REST", () => {
    const raw = JSON.stringify({
      code: "200000",
      data: [{ sequence: "1", price: "1", size: "1", side: "sell", time: 1781767013457000000 }],
    });
    const [t] = kucoinAdapter.parseRestResponse(raw, kcfg);
    expect(t.side).toBe("SELL");
    expect(kucoinAdapter.restUrl(kcfg)).toBe("/api/proxy/trades?exchange=kucoin&symbol=BTC-USDT");
    expect(kucoinAdapter.wsUrl(kcfg)).toBeNull(); // REST-only venue
  });

  it("returns [] on a proxy error envelope", () => {
    expect(kucoinAdapter.parseRestResponse(JSON.stringify({ error: "blocked" }), kcfg)).toEqual([]);
  });
});

describe("Adapter registry", () => {
  it("registers exactly the five supported venues", () => {
    expect(EXCHANGES).toHaveLength(5);
    for (const id of EXCHANGES) {
      const a = getAdapter(id);
      expect(a).toBe(ADAPTERS[id]);
      expect(a.meta.id).toBe(id);
    }
  });

  it("every adapter degrades gracefully on empty / malformed input", () => {
    for (const id of EXCHANGES) {
      const a = ADAPTERS[id];
      const c: StreamConfig = { exchange: id, base: "BTC", quote: "USDT", category: "spot" };
      expect(a.parseWsMessage("", c)).toEqual([]);
      expect(a.parseWsMessage("not json {", c)).toEqual([]);
      expect(a.parseRestResponse("not json {", c)).toEqual([]);
    }
  });
});
