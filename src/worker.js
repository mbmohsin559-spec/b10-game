const BETTING_MS = 12000;
const BREAK_MS = 3000;
const GROWTH_RATE = 0.085;

function randomCrash() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  const value = bytes[0] / 4294967296;
  return Math.round((1.15 + value * 4.85) * 100) / 100;
}

function response(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export default {
  async fetch(request, env) {
    const id = env.AVIATOR.idFromName("main");
    const room = env.AVIATOR.get(id);
    return room.fetch(request);
  }
};

export class AviatorRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async getState() {
    const now = Date.now();
    let game = await this.ctx.storage.get("game");

    if (!game) {
      game = {
        round: 1,
        start: now,
        crash: randomCrash(),
        history: []
      };
      await this.ctx.storage.put("game", game);
    }

    let changed = false;

    for (let i = 0; i < 100; i++) {
      const flightMs = Math.log(game.crash) / GROWTH_RATE * 1000;
      const nextStart = game.start + BETTING_MS + flightMs + BREAK_MS;

      if (now < nextStart) break;

      game.history.unshift(game.crash);
      game.history = game.history.slice(0, 20);
      game.round++;
      game.start = nextStart;
      game.crash = randomCrash();
      changed = true;
    }

    if (changed) {
      await this.ctx.storage.put("game", game);
    }

    const flightStart = game.start + BETTING_MS;
    const crashAt = flightStart + Math.log(game.crash) / GROWTH_RATE * 1000;
    const nextRoundAt = crashAt + BREAK_MS;

    let phase;
    let multiplier = 1;
    let remaining = 0;

    if (now < flightStart) {
      phase = "waiting";
      remaining = Math.ceil((flightStart - now) / 1000);
    } else if (now < crashAt) {
      phase = "flying";
      multiplier = Math.exp((now - flightStart) / 1000 * GROWTH_RATE);
    } else {
      phase = "crashed";
      multiplier = game.crash;
      remaining = Math.ceil((nextRoundAt - now) / 1000);
    }

    return {
      game: "B10 GAME",
      round: game.round,
      phase,
      multiplier: Number(multiplier.toFixed(2)),
      remaining,
      serverTime: now,
      startAt: game.start,
      bettingEndsAt: flightStart,
      crashAt,
      nextRoundAt,
      history: game.history,
      crashPoint: phase === "crashed" ? game.crash : null
    };
  }

  async fetch(request) {
    if (request.method === "OPTIONS") {
      return response({ ok: true });
    }

    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];

      this.ctx.acceptWebSocket(server);

      const state = await this.getState();
      server.send(JSON.stringify(state));

      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }

    if (request.method !== "GET") {
      return response({ error: "GET only" }, 405);
    }

    return response(await this.getState());
  }

  async webSocketMessage(ws, message) {
    try {
      const state = await this.getState();
      ws.send(JSON.stringify(state));
    } catch (error) {
      ws.send(JSON.stringify({ error: "State unavailable" }));
    }
  }

  async webSocketClose(ws, code, reason, wasClean) {
    ws.close(code, "Connection closed");
  }

  async webSocketError(ws, error) {
    ws.close(1011, "WebSocket error");
  }
}
