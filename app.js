const QUIZ_EL = document.getElementById("quiz");
const ESTADO_MODO_EL = document.getElementById("estadoModo");
const PROGRESO_TEXTO_EL = document.getElementById("progresoTexto");
const BARRA_PROGRESO_EL = document.getElementById("barraProgreso");

const STORAGE_RANKING = "tema4_ranking";
const STORAGE_ESTADO = "tema4_estado_actual";

let bancoPreguntas = [];
let preguntasActuales = [];
let indiceActual = 0;
let respuestasUsuario = [];
let modoActual = "simulador";
let nombreJugador = "";

let temporizadorIntervalo = null;
let tiempoRestante = null;
let esModoExamen = false;

/* =========================
   UTILIDADES
========================= */

function mezclarArray(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function escaparHTML(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function obtenerTextoPregunta(item) {
  return (
    item.pregunta ||
    item.enunciado ||
    item.texto ||
    item.question ||
    "Pregunta sin texto"
  );
}

function obtenerOpciones(item) {
  if (Array.isArray(item.opciones)) return item.opciones;
  if (Array.isArray(item.respuestas)) return item.respuestas;
  if (Array.isArray(item.options)) return item.options;
  return [];
}

function obtenerRespuestaCorrecta(item) {
  if (typeof item.correcta !== "undefined") return item.correcta;
  if (typeof item.correcto !== "undefined") return item.correcto;
  if (typeof item.respuestaCorrecta !== "undefined") return item.respuestaCorrecta;
  if (typeof item.respuesta !== "undefined") return item.respuesta;
  if (typeof item.answer !== "undefined") return item.answer;
  return null;
}

function normalizarPregunta(item, origen = "General") {
  const opciones = obtenerOpciones(item);
  const correcta = obtenerRespuestaCorrecta(item);

  return {
    bloque: item.bloque || origen,
    pregunta: obtenerTextoPregunta(item),
    opciones,
    correcta
  };
}

function esArrayDePreguntas(valor) {
  if (!Array.isArray(valor) || valor.length === 0) return false;

  const ejemplo = valor[0];
  return (
    ejemplo &&
    typeof ejemplo === "object" &&
    (
      "pregunta" in ejemplo ||
      "enunciado" in ejemplo ||
      "texto" in ejemplo ||
      "question" in ejemplo
    ) &&
    (
      "opciones" in ejemplo ||
      "respuestas" in ejemplo ||
      "options" in ejemplo
    )
  );
}

/* =========================
   DETECCIÓN DE PREGUNTAS
========================= */

function recogerPreguntasDelWindow() {
  const candidatos = [];

  for (const clave of Object.keys(window)) {
    try {
      const valor = window[clave];
      if (esArrayDePreguntas(valor)) {
        candidatos.push({
          nombre: clave,
          datos: valor
        });
      }
    } catch (error) {
      // Ignorar
    }
  }

  const vistos = new Set();
  const arraysUnicos = candidatos.filter((candidato) => {
    if (vistos.has(candidato.datos)) return false;
    vistos.add(candidato.datos);
    return true;
  });

  let todas = [];

  arraysUnicos.forEach((entrada, i) => {
    const nombreBloque = entrada.nombre || `Bloque ${i + 1}`;
    const normalizadas = entrada.datos.map((pregunta) =>
      normalizarPregunta(pregunta, nombreBloque)
    );
    todas = todas.concat(normalizadas);
  });

  return todas;
}

/* =========================
   CÁLCULOS
========================= */

function calcularAciertos() {
  let aciertos = 0;

  preguntasActuales.forEach((pregunta, i) => {
    const respuestaUsuario = respuestasUsuario[i];
    if (respuestaUsuario === null || typeof respuestaUsuario === "undefined") return;

    const correcta = pregunta.correcta;

    if (typeof correcta === "number") {
      if (respuestaUsuario === correcta) aciertos++;
    } else {
      const opcionTexto = pregunta.opciones[respuestaUsuario];
      if (String(opcionTexto).trim() === String(correcta).trim()) aciertos++;
    }
  });

  return aciertos;
}

function calcularRespondidas() {
  return respuestasUsuario.filter(
    (respuesta) => respuesta !== null && typeof respuesta !== "undefined"
  ).length;
}

function calcularFallosRespondidos() {
  const respondidas = calcularRespondidas();
  const aciertos = calcularAciertos();
  return respondidas - aciertos;
}

function calcularNotaSobre10() {
  if (!preguntasActuales.length) return 0;
  return (calcularAciertos() / preguntasActuales.length) * 10;
}

/* =========================
   GUARDADO DE ESTADO
========================= */

function guardarEstado() {
  const estado = {
    preguntasActuales,
    indiceActual,
    respuestasUsuario,
    modoActual,
    nombreJugador,
    tiempoRestante,
    esModoExamen
  };

  localStorage.setItem(STORAGE_ESTADO, JSON.stringify(estado));
}

function cargarEstado() {
  const raw = localStorage.getItem(STORAGE_ESTADO);
  if (!raw) return false;

  try {
    const estado = JSON.parse(raw);
    if (!estado || !Array.isArray(estado.preguntasActuales)) return false;

    preguntasActuales = estado.preguntasActuales;
    indiceActual = estado.indiceActual ?? 0;
    respuestasUsuario =
      estado.respuestasUsuario ?? Array(estado.preguntasActuales.length).fill(null);
    modoActual = estado.modoActual ?? "simulador";
    nombreJugador = estado.nombreJugador ?? "";
    tiempoRestante = estado.tiempoRestante ?? null;
    esModoExamen = estado.esModoExamen ?? false;

    return preguntasActuales.length > 0;
  } catch (error) {
    return false;
  }
}

function borrarEstado() {
  localStorage.removeItem(STORAGE_ESTADO);
}

/* =========================
   RANKING
========================= */

function obtenerRanking() {
  const raw = localStorage.getItem(STORAGE_RANKING);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function guardarEnRanking(nombre, nota, aciertos, total) {
  const ranking = obtenerRanking();

  ranking.push({
    nombre: nombre || "Jugador",
    nota: Number(nota.toFixed(2)),
    aciertos,
    total,
    fecha: new Date().toLocaleString("es-ES")
  });

  ranking.sort((a, b) => {
    if (b.nota !== a.nota) return b.nota - a.nota;
    return b.aciertos - a.aciertos;
  });

  const top10 = ranking.slice(0, 10);
  localStorage.setItem(STORAGE_RANKING, JSON.stringify(top10));
}

function pintarRankingHTML() {
  const ranking = obtenerRanking();

  if (!ranking.length) {
    return `<p class="sin-ranking">Aún no hay resultados guardados.</p>`;
  }

  return `
    <ol class="ranking-lista">
      ${ranking
        .map(
          (item) => `
            <li class="ranking-item">
              <strong>${escaparHTML(item.nombre)}</strong>
              <span> · Nota ${item.nota}</span>
              <span> · ${item.aciertos}/${item.total}</span>
              <div class="ranking-fecha">${escaparHTML(item.fecha)}</div>
            </li>
          `
        )
        .join("")}
    </ol>
  `;
}

/* =========================
   PROGRESO
========================= */

function actualizarProgreso() {
  const total = preguntasActuales.length || 0;
  const respondidas = calcularRespondidas();
  const porcentaje = total ? Math.round((respondidas / total) * 100) : 0;

  PROGRESO_TEXTO_EL.textContent = total
    ? `${respondidas} de ${total} respondidas`
    : "Sin iniciar";

  BARRA_PROGRESO_EL.style.width = `${porcentaje}%`;
}

function actualizarProgresoFinal() {
  PROGRESO_TEXTO_EL.textContent = "Examen completado";
  BARRA_PROGRESO_EL.style.width = "100%";
}

/* =========================
   TEMPORIZADOR
========================= */

function iniciarModoExamen() {
  const nombreInput = document.getElementById("nombreJugador");
  nombreJugador = nombreInput ? nombreInput.value.trim() : "";

  modoActual = "examen";
  esModoExamen = true;
  preguntasActuales = mezclarArray(bancoPreguntas).slice(0, 30);
  indiceActual = 0;
  respuestasUsuario = Array(preguntasActuales.length).fill(null);
  tiempoRestante = 30 * 60;

  guardarEstado();
  iniciarTemporizador();
  renderPregunta();
}

function iniciarTemporizador() {
  detenerTemporizador();

  if (!esModoExamen || tiempoRestante === null) return;

  temporizadorIntervalo = setInterval(() => {
    tiempoRestante--;

    if (tiempoRestante <= 0) {
      tiempoRestante = 0;
      guardarEstado();
      detenerTemporizador();
      alert("Se ha terminado el tiempo del examen.");
      pantallaResultados();
      return;
    }

    guardarEstado();
    actualizarTemporizadorVisual();
  }, 1000);
}

function detenerTemporizador() {
  if (temporizadorIntervalo) {
    clearInterval(temporizadorIntervalo);
    temporizadorIntervalo = null;
  }
}

function formatearTiempo(segundos) {
  const min = Math.floor(segundos / 60);
  const sec = segundos % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function actualizarTemporizadorVisual() {
  const el = document.getElementById("temporizadorExamen");
  if (el && esModoExamen && tiempoRestante !== null) {
    el.textContent = formatearTiempo(tiempoRestante);
  }
}

/* =========================
   PANTALLAS
========================= */

function pantallaInicio() {
  ESTADO_MODO_EL.textContent = "Elige un modo de estudio";

  QUIZ_EL.innerHTML = `
    <section class="card card-inicio">
      <h2>Simulador de examen</h2>
      <p>Ahora puedes avanzar, volver atrás, guardar respuestas, ver aciertos y entrar en ranking.</p>

      <div class="bloque-formulario">
        <label for="nombreJugador">Tu nombre para el ranking</label>
        <input id="nombreJugador" type="text" placeholder="Escribe tu nombre">
      </div>

      <div class="acciones-modos">
        <button id="btnTemaCompleto" class="btn-principal">Empezar tema completo</button>
        <button id="btnTemaAleatorio" class="btn-secundario">Tema completo aleatorio</button>
        <button id="btnModoExamen" class="btn-secundario">Modo examen UNED (30 preguntas)</button>
        <button id="btnContinuar" class="btn-secundario">Continuar intento guardado</button>
        <button id="btnVerRanking" class="btn-secundario">Ver ranking</button>
      </div>

      <div class="ranking-box">
        <h3>Top actual</h3>
        ${pintarRankingHTML()}
      </div>
    </section>
  `;

  document
    .getElementById("btnTemaCompleto")
    .addEventListener("click", () => iniciarQuiz(false));

  document
    .getElementById("btnTemaAleatorio")
    .addEventListener("click", () => iniciarQuiz(true));

  document
    .getElementById("btnModoExamen")
    .addEventListener("click", iniciarModoExamen);

  document
    .getElementById("btnContinuar")
    .addEventListener("click", continuarIntento);

  document
    .getElementById("btnVerRanking")
    .addEventListener("click", pantallaRanking);
}

function pantallaRanking() {
  ESTADO_MODO_EL.textContent = "Ranking del simulador";

  QUIZ_EL.innerHTML = `
    <section class="card">
      <h2>Ranking</h2>
      ${pintarRankingHTML()}
      <div class="nav-botones">
        <button id="btnVolverInicio" class="btn-secundario">Volver al inicio</button>
        <button id="btnBorrarRanking" class="btn-peligro">Borrar ranking</button>
      </div>
    </section>
  `;

  document
    .getElementById("btnVolverInicio")
    .addEventListener("click", pantallaInicio);

  document
    .getElementById("btnBorrarRanking")
    .addEventListener("click", () => {
      localStorage.removeItem(STORAGE_RANKING);
      pantallaRanking();
    });
}

function iniciarQuiz(aleatorio = false) {
  const nombreInput = document.getElementById("nombreJugador");
  nombreJugador = nombreInput ? nombreInput.value.trim() : "";

  modoActual = aleatorio ? "simulador-aleatorio" : "simulador";
  esModoExamen = false;
  tiempoRestante = null;
  detenerTemporizador();

  preguntasActuales = aleatorio ? mezclarArray(bancoPreguntas) : [...bancoPreguntas];
  indiceActual = 0;
  respuestasUsuario = Array(preguntasActuales.length).fill(null);

  guardarEstado();
  renderPregunta();
}

function continuarIntento() {
  const hay = cargarEstado();

  if (!hay) {
    alert("No hay un intento guardado.");
    return;
  }

  if (esModoExamen) {
    iniciarTemporizador();
  }

  renderPregunta();
}

function renderPregunta() {
  if (!preguntasActuales.length) {
    pantallaInicio();
    return;
  }

  const item = preguntasActuales[indiceActual];
  const respuestaMarcada = respuestasUsuario[indiceActual];

  ESTADO_MODO_EL.textContent =
    modoActual === "examen"
      ? "Modo examen UNED"
      : modoActual === "simulador-aleatorio"
      ? "Modo simulador aleatorio"
      : "Modo simulador";

  const aciertos = calcularAciertos();
  const fallos = calcularFallosRespondidos();
  const respondidas = calcularRespondidas();

  QUIZ_EL.innerHTML = `
    <section class="card card-pregunta">
      <div class="stats-grid">
        <div class="stat"><strong>Pregunta</strong><span>${indiceActual + 1} / ${preguntasActuales.length}</span></div>
        <div class="stat"><strong>Respondidas</strong><span>${respondidas}</span></div>
        <div class="stat"><strong>Aciertos</strong><span>${aciertos}</span></div>
        <div class="stat"><strong>Fallos</strong><span>${fallos}</span></div>
      </div>

      ${
        esModoExamen
          ? `
        <div class="temporizador-box">
          <strong>Tiempo restante:</strong>
          <span id="temporizadorExamen">${formatearTiempo(tiempoRestante)}</span>
        </div>
      `
          : ""
      }

      <div class="bloque-info">
        <span class="bloque-etiqueta">${escaparHTML(item.bloque || "Bloque")}</span>
      </div>

      <h2 class="pregunta-titulo">${escaparHTML(item.pregunta)}</h2>

      <div class="opciones">
        ${item.opciones
          .map(
            (opcion, i) => `
              <label class="opcion ${respuestaMarcada === i ? "seleccionada" : ""}">
                <input type="radio" name="respuesta" value="${i}" ${
              respuestaMarcada === i ? "checked" : ""
            }>
                <span>${String.fromCharCode(65 + i)}. ${escaparHTML(opcion)}</span>
              </label>
            `
          )
          .join("")}
      </div>

      <div class="nav-botones">
        <button id="btnAnterior" class="btn-secundario" ${
          indiceActual === 0 ? "disabled" : ""
        }>← Anterior</button>
        <button id="btnGuardar" class="btn-secundario">Guardar respuesta</button>
        <button id="btnSiguiente" class="btn-principal">
          ${indiceActual === preguntasActuales.length - 1 ? "Finalizar" : "Siguiente →"}
        </button>
      </div>
    </section>
  `;

  document.querySelectorAll('input[name="respuesta"]').forEach((input) => {
    input.addEventListener("change", (e) => {
      respuestasUsuario[indiceActual] = Number(e.target.value);
      guardarEstado();
      renderPregunta();
    });
  });

  document.getElementById("btnAnterior").addEventListener("click", () => {
    if (indiceActual > 0) {
      indiceActual--;
      guardarEstado();
      renderPregunta();
    }
  });

  document.getElementById("btnGuardar").addEventListener("click", () => {
    guardarEstado();
    actualizarProgreso();
    alert("Respuesta guardada.");
  });

  document.getElementById("btnSiguiente").addEventListener("click", () => {
    if (indiceActual < preguntasActuales.length - 1) {
      indiceActual++;
      guardarEstado();
      renderPregunta();
    } else {
      pantallaResultados();
    }
  });

  actualizarProgreso();
  actualizarTemporizadorVisual();
}

function pantallaResultados() {
  detenerTemporizador();

  const aciertos = calcularAciertos();
  const total = preguntasActuales.length;
  const fallos = total - aciertos;
  const nota = calcularNotaSobre10();

  guardarEnRanking(nombreJugador || "Jugador", nota, aciertos, total);

  esModoExamen = false;
  tiempoRestante = null;
  borrarEstado();

  ESTADO_MODO_EL.textContent = "Resultado final";

  QUIZ_EL.innerHTML = `
    <section class="card card-resultado">
      <h2>Resultado final</h2>

      <div class="stats-grid">
        <div class="stat"><strong>Aciertos</strong><span>${aciertos}</span></div>
        <div class="stat"><strong>Fallos</strong><span>${fallos}</span></div>
        <div class="stat"><strong>Total</strong><span>${total}</span></div>
        <div class="stat"><strong>Nota</strong><span>${nota.toFixed(2)} / 10</span></div>
      </div>

      <div class="ranking-box">
        <h3>Ranking</h3>
        ${pintarRankingHTML()}
      </div>

      <div class="nav-botones">
        <button id="btnRepetir" class="btn-principal">Hacer otro intento</button>
        <button id="btnIrRanking" class="btn-secundario">Ver ranking</button>
      </div>
    </section>
  `;

  document.getElementById("btnRepetir").addEventListener("click", pantallaInicio);
  document.getElementById("btnIrRanking").addEventListener("click", pantallaRanking);

  actualizarProgresoFinal();
}

/* =========================
   INICIO
========================= */

function iniciarApp() {
  bancoPreguntas = recogerPreguntasDelWindow();

  if (!bancoPreguntas.length) {
    QUIZ_EL.innerHTML = `
      <section class="card">
        <h2>No se han detectado preguntas</h2>
        <p>Revisa cómo están definidos tus archivos <code>preguntas_bloqueX.js</code>.</p>
        <p>Cada bloque debería contener un array de objetos parecido a este:</p>
        <pre>
const preguntasBloque1 = [
  {
    pregunta: "¿Texto?",
    opciones: ["A", "B", "C", "D"],
    correcta: 1
  }
];
        </pre>
      </section>
    `;
    return;
  }

  pantallaInicio();
  actualizarProgreso();
}

document.addEventListener("DOMContentLoaded", iniciarApp);