import { getStore } from "@netlify/blobs";

const STORE = "numeros-dudosos";
const KEY = "lista";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

// Normaliza un número: deja solo dígitos y el "+" inicial
const normalizar = (n) => {
  const limpio = String(n || "").trim().replace(/[^\d+]/g, "");
  return limpio.startsWith("+") ? "+" + limpio.slice(1).replace(/\D/g, "") : limpio.replace(/\D/g, "");
};

async function leerLista(store) {
  const data = await store.get(KEY, { type: "json" });
  return Array.isArray(data) ? data : [];
}

export default async (req) => {
  const store = getStore(STORE);
  const url = new URL(req.url);

  // ---------- CONSULTA ----------
  if (req.method === "GET") {
    const q = normalizar(url.searchParams.get("q") || "");
    let lista = await leerLista(store);
    if (q) lista = lista.filter((r) => r.numero.includes(q));
    // Más reportados primero, luego más recientes
    lista.sort(
      (a, b) =>
        b.reportes.length - a.reportes.length ||
        new Date(b.reportes[b.reportes.length - 1].fecha) -
          new Date(a.reportes[a.reportes.length - 1].fecha)
    );
    return json({ total: lista.length, resultados: lista });
  }

  // ---------- AGREGAR ----------
  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Cuerpo JSON inválido" }, 400);
    }

    const numero = normalizar(body.numero);
    const agregadoPor = String(body.agregadoPor || "").trim();
    const metodo = String(body.metodo || "").trim();
    const descripcion = String(body.descripcion || "").trim();

    if (numero.replace("+", "").length < 6)
      return json({ error: "El número debe tener al menos 6 dígitos" }, 400);
    if (!agregadoPor)
      return json({ error: "El campo 'Agregado por' es obligatorio" }, 400);
    if (agregadoPor.length > 60 || metodo.length > 60 || descripcion.length > 600)
      return json({ error: "Uno de los campos excede el largo permitido" }, 400);

    const reporte = {
      agregadoPor,
      metodo: metodo || "No especificado",
      descripcion: descripcion || "",
      fecha: new Date().toISOString(),
    };

    const lista = await leerLista(store);
    const existente = lista.find((r) => r.numero === numero);

    if (existente) {
      existente.reportes.push(reporte);
    } else {
      lista.push({ numero, reportes: [reporte] });
    }

    await store.setJSON(KEY, lista);
    return json({
      ok: true,
      numero,
      totalReportes: existente ? existente.reportes.length : 1,
      nuevo: !existente,
    });
  }

  // ---------- BORRAR (requiere clave maestra) ----------
  if (req.method === "DELETE") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Cuerpo JSON inválido" }, 400);
    }

    const clave = String(body.clave || "");
    const CLAVE_MAESTRA = process.env.CLAVE_MAESTRA || "PokitoPajaro";
    if (clave !== CLAVE_MAESTRA)
      return json({ error: "Clave maestra incorrecta" }, 401);

    const numero = normalizar(body.numero);
    const lista = await leerLista(store);
    const indice = lista.findIndex((r) => r.numero === numero);
    if (indice === -1)
      return json({ error: "El número no existe en el registro" }, 404);

    lista.splice(indice, 1);
    await store.setJSON(KEY, lista);
    return json({ ok: true, eliminado: numero });
  }

  return json({ error: "Método no permitido" }, 405);
};

export const config = { path: "/api/numeros" };
