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
  return item.pregunta || item.enunciado || item.texto || item.question || "Pregunta sin texto";
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
  return {
    bloque: item.bloque || origen,
    pregunta: obtenerTextoPregunta(item),
    opciones: obtenerOpciones(item),
    correcta: obtenerRespuestaCorrecta(item),
    explicacion: item.explicacion || ""
  };
}

function esArrayDePreguntas(valor) {
  if (!Array.isArray(valor) || valor.length === 0) return false;
  const ejemplo = valor[0];
  return (
    ejemplo &&
    typeof ejemplo === "object" &&
    ("pregunta" in ejemplo || "enunciado" in ejemplo || "texto" in ejemplo || "question" in ejemplo) &&
    ("opciones" in ejemplo || "respuestas" in ejemplo || "options" in ejemplo)
  );
}

function obtenerNumeroDeBloque(nombreBloque) {
  const match = String(nombreBloque).match(/\d+/);
  return match ? Number(match[0]) : 999;
}

function obtenerBloquesDisponibles() {
  const unicos = [...new Set(bancoPreguntas.map((p) => p.bloque))];
  return unicos.sort((a, b) => obtenerNumeroDeBloque(a) - obtenerNumeroDeBloque(b));
}

function obtenerIndiceCorrecto(item) {
  if (typeof item.correcta === "number") return item.correcta;

  if (typeof item.correcta === "string") {
    return item.opciones.findIndex(
      (op) => String(op).trim() === String(item.correcta).trim()
    );
  }

  return -1;
}

function estaRespuestaBien(item, respuestaUsuario) {
  if (respuestaUsuario === null || typeof respuestaUsuario === "undefined") return false;

  if (typeof item.correcta === "number") {
    return respuestaUsuario === item.correcta;
  }

  const opcionTexto = item.opciones[respuestaUsuario];
  return String(opcionTexto).trim() === String(item.correcta).trim();
}

/* =========================
   CARGA DE BLOQUES
========================= */

function recogerPreguntasDelWindow() {
  const bloquesDetectados = [
    typeof preguntasBloque1 !== "undefined" ? { nombre: "Bloque 1", datos: preguntasBloque1 } : null,
    typeof preguntasBloque2 !== "undefined" ? { nombre: "Bloque 2", datos: preguntasBloque2 } : null,
    typeof preguntasBloque3 !== "undefined" ? { nombre: "Bloque 3", datos: preguntasBloque3 } : null,
    typeof preguntasBloque4 !== "undefined" ? { nombre: "Bloque 4", datos: preguntasBloque4 } : null,
    typeof preguntasBloque5 !== "undefined" ? { nombre: "Bloque 5", datos: preguntasBloque5 } : null,
    typeof preguntasBloque6 !== "undefined" ? { nombre: "Bloque 6", datos: preguntasBloque6 } : null,
    typeof preguntasBloque7 !== "undefined" ? { nombre: "Bloque 7", datos: preguntasBloque7 } : null,
    typeof preguntasBloque8 !== "undefined" ? { nombre: "Bloque 8", datos: preguntasBloque8 } : null,
    typeof preguntasBloque9 !== "undefined" ? { nombre: "Bloque 9", datos: preguntasBloque9 } : null,
    typeof preguntasBloque10 !== "undefined" ? { nombre: "Bloque 10", datos: preguntasBloque10 } : null,
    typeof preguntasBloque11 !== "undefined" ? { nombre: "Bloque 11", datos: preguntasBloque11 } : null,
    typeof preguntasBloque12 !== "undefined" ? { nombre: "Bloque 12", datos: preguntasBloque12 } : null,
    typeof preguntasBloque13 !== "undefined" ? { nombre: "Bloque 13", datos: preguntasBloque13 } : null,
    typeof preguntasBloque14 !== "undefined" ? { nombre: "Bloque 14", datos: preguntasBloque14 } : null,
    typeof preguntasBloque15 !== "undefined" ? { nombre: "Bloque 15", datos: preguntasBloque15 } : null,
    typeof preguntasBloque16 !== "undefined" ? { nombre: "Bloque 16", datos: preguntasBloque16 } : null,
    typeof preguntasBloque17 !== "undefined" ? { nombre: "Bloque 17", datos: preguntasBloque17 } : null,
    typeof preguntasBloque18 !== "undefined" ? { nombre: "Bloque 18", datos: preguntasBloque18 } : null,
    typeof preguntasBloque19 !== "undefined" ? { nombre: "Bloque 19", datos: preguntasBloque19 } : null,
    typeof preguntasBloque20 !== "undefined" ? { nombre: "Bloque 20", datos: preguntasBloque20 } : null
  ].filter(Boolean);

  let todas = [];

  bloquesDetectados.forEach((entrada) => {
    if (esArrayDePreguntas(entrada.datos)) {
      todas = todas.concat(
        entrada.datos.map((pregunta) => normalizarPregunta(pregunta, entrada.nombre))
      );
    }
  });

  return todas;
}

/* =========================
   CÁLCULOS
========================= */

function calcularAciertos() {
  let aciertos = 0;

  preguntasActuales.forEach((pregunta, i) => {
    const respuesta = respuestasUsuario[i];
    if (respuesta === null || typeof respuesta === "undefined") return;

    if (estaRespuestaBien(pregunta, respuesta)) {
      aciertos++;
    }
  });

  return aciertos;
}

function calcularRespondidas() {
  return respuestasUsuario.filter((r) => r !== null && typeof r !== "undefined").length;
}

function calcularFallosRespondidos() {
  return calcularRespondidas() - calcularAciertos();
}

function calcularNotaSobre10() {
  if (!preguntasActuales.length) return 0;
  return (calcularAciertos() / preguntasActuales.length) * 10;
}

/* =========================
   ESTADO Y STORAGE
========================= */

function guardarEstado() {
  localStorage.setItem(
    STORAGE_ESTADO,
    JSON.stringify({
      preguntasActuales,
      indiceActual,
      respuestasUsuario,
      modoActual,
      nombreJugador,
      tiempoRestante,
      esModoExamen
    })
  );
}

function cargarEstado() {
  const raw = localStorage.getItem(STORAGE_ESTADO);
  if (!raw) return false;

  try {
    const estado = JSON.parse(raw);
    if (!estado || !Array.isArray(estado.preguntasActuales)) return false;

    preguntasActuales = estado.preguntasActuales;
    indiceActual = estado.indiceActual ?? 0;
    respuestasUsuario = estado.respuestasUsuario ?? Array(preguntasActuales.length).fill(null);
    modoActual = estado.modoActual ?? "simulador";
    nombreJugador = estado.nombreJugador ?? "";
    tiempoRestante = estado.tiempoRestante ?? null;
    esModoExamen = estado.esModoExamen ?? false;

    return preguntasActuales.length > 0;
  } catch {
    return false;
  }
}

function borrarEstado() {
  localStorage.removeItem(STORAGE_ESTADO);
}

function obtenerRanking() {
  const raw = localStorage.getItem(STORAGE_RANKING);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
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

  localStorage.setItem(STORAGE_RANKING, JSON.stringify(ranking.slice(0, 10)));
}

function pintarRankingHTML() {
  const ranking = obtenerRanking();

  if (!ranking.length) {
    return `<p class="sin-ranking">Aún no hay resultados guardados.</p>`;
  }

  return `
    <ol class="ranking-lista">
      ${ranking.map((item) => `
        <li class="ranking-item">
          <strong>${escaparHTML(item.nombre)}</strong>
          <span> · Nota ${item.nota}</span>
          <span> · ${item.aciertos}/${item.total}</span>
          <div class="ranking-fecha">${escaparHTML(item.fecha)}</div>
        </li>
      `).join("")}
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

  PROGRESO_TEXTO_EL.textContent =
    total ? `${respondidas} de ${total} respondidas` : "Sin iniciar";

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

function iniciarBloque(nombreBloque) {
  const nombreInput = document.getElementById("nombreJugador");
  nombreJugador = nombreInput ? nombreInput.value.trim() : "";

  const preguntasDelBloque = bancoPreguntas.filter(
    (pregunta) => pregunta.bloque === nombreBloque
  );

  modoActual = `bloque-${nombreBloque}`;
  esModoExamen = false;
  tiempoRestante = null;
  detenerTemporizador();

  preguntasActuales = [...preguntasDelBloque];
  indiceActual = 0;
  respuestasUsuario = Array(preguntasActuales.length).fill(null);

  guardarEstado();
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

function pintarTarjetasBloques() {
  const bloques = obtenerBloquesDisponibles();

  if (!bloques.length) return "";

  return `
    <section class="card bloques-card">
      <div class="portada-top">
        <span class="insignia-portada">Bloques del tema</span>
        <h3>Entrena por bloques</h3>
        <p class="subtitulo-portada">
          Accede a cada bloque por separado con el mismo formato de examen tipo UNED.
        </p>
      </div>

      <div class="grid-bloques">
        ${bloques.map((bloque) => `
          <button class="bloque-card" data-bloque="${escaparHTML(bloque)}">
            <span class="bloque-card-numero">${escaparHTML(bloque)}</span>
            <span class="bloque-card-subtitulo">Examen tipo UNED</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function pantallaInicio() {
  detenerTemporizador();
  ESTADO_MODO_EL.textContent = "Elige un modo de estudio";

  QUIZ_EL.innerHTML = `
    <section class="card card-inicio">
      <div class="portada-top">
        <span class="insignia-portada">Preparación UNED</span>
        <h2>Entrena el Tema 4 con simulador y examen realista</h2>
        <p class="subtitulo-portada">
          Elige cómo quieres estudiar: repaso completo, práctica aleatoria o simulacro de examen UNED con tiempo.
        </p>
      </div>

      <div class="bloque-formulario">
        <label for="nombreJugador">Tu nombre para el ranking</label>
        <input id="nombreJugador" type="text" placeholder="Escribe tu nombre">
      </div>

      <div class="grid-modos">
        <button id="btnTemaCompleto" class="modo-card modo-card-principal">
          <span class="modo-icono">📘</span>
          <span class="modo-titulo">Estudiar tema completo</span>
          <span class="modo-texto">Recorre todas las preguntas del tema para consolidar contenidos.</span>
        </button>

        <button id="btnTemaAleatorio" class="modo-card">
          <span class="modo-icono">🔀</span>
          <span class="modo-titulo">Práctica aleatoria</span>
          <span class="modo-texto">Entrena mezclando preguntas para ganar agilidad mental.</span>
        </button>

        <button id="btnModoExamen" class="modo-card modo-card-examen">
          <span class="modo-icono">🧠</span>
          <span class="modo-titulo">Simulador de examen UNED</span>
          <span class="modo-texto">30 preguntas aleatorias con temporizador para entrenar como en examen.</span>
        </button>

        <button id="btnContinuar" class="modo-card">
          <span class="modo-icono">⏯️</span>
          <span class="modo-titulo">Continuar intento</span>
          <span class="modo-texto">Retoma tu progreso guardado y sigue desde donde lo dejaste.</span>
        </button>
      </div>

      <div class="acciones-secundarias">
        <button id="btnVerRanking" class="btn-secundario">Ver ranking</button>
      </div>

      <div class="ranking-box">
        <h3>Top actual</h3>
        ${pintarRankingHTML()}
      </div>
    </section>

    ${pintarTarjetasBloques()}
  `;

  document.getElementById("btnTemaCompleto").addEventListener("click", () => iniciarQuiz(false));
  document.getElementById("btnTemaAleatorio").addEventListener("click", () => iniciarQuiz(true));
  document.getElementById("btnModoExamen").addEventListener("click", iniciarModoExamen);
  document.getElementById("btnContinuar").addEventListener("click", continuarIntento);
  document.getElementById("btnVerRanking").addEventListener("click", pantallaRanking);

  document.querySelectorAll(".bloque-card").forEach((boton) => {
    boton.addEventListener("click", () => {
      iniciarBloque(boton.dataset.bloque);
    });
  });

  preguntasActuales = [];
  respuestasUsuario = [];
  indiceActual = 0;
  actualizarProgreso();
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

  document.getElementById("btnVolverInicio").addEventListener("click", pantallaInicio);
  document.getElementById("btnBorrarRanking").addEventListener("click", () => {
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

function crearHTMLFeedback(item, respuestaMarcada) {
  if (respuestaMarcada === null || typeof respuestaMarcada === "undefined") {
    return `
      <div class="feedback-box feedback-pendiente">
        <strong>Selecciona una opción</strong>
        <p>Cuando marques una respuesta aparecerá aquí si es correcta o incorrecta y el porqué.</p>
      </div>
    `;
  }

  const correctaIndex = obtenerIndiceCorrecto(item);
  const esCorrecta = estaRespuestaBien(item, respuestaMarcada);

  if (esCorrecta) {
    return `
      <div class="feedback-box feedback-correcto">
        <strong>✅ Correcta</strong>
        <p>${escaparHTML(item.explicacion || "Has elegido la respuesta adecuada.")}</p>
      </div>
    `;
  }

  const textoRespuestaCorrecta =
    correctaIndex >= 0 && item.opciones[correctaIndex]
      ? `${String.fromCharCode(65 + correctaIndex)}. ${escaparHTML(item.opciones[correctaIndex])}`
      : escaparHTML(String(item.correcta));

  return `
    <div class="feedback-box feedback-incorrecto">
      <strong>❌ Incorrecta</strong>
      <p><strong>Respuesta correcta:</strong> ${textoRespuestaCorrecta}</p>
      <p><strong>Por qué:</strong> ${escaparHTML(item.explicacion || "Revisa el concepto clave de esta pregunta.")}</p>
    </div>
  `;
}

function renderPregunta() {
  if (!preguntasActuales.length) {
    pantallaInicio();
    return;
  }

  const item = preguntasActuales[indiceActual];
  const respuestaMarcada = respuestasUsuario[indiceActual];
  const correctaIndex = obtenerIndiceCorrecto(item);

  ESTADO_MODO_EL.textContent =
    modoActual === "examen"
      ? "Modo examen UNED"
      : modoActual.startsWith("bloque-")
      ? `Modo ${item.bloque}`
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

      ${esModoExamen ? `
        <div class="temporizador-box">
          <strong>Tiempo restante:</strong>
          <span id="temporizadorExamen">${formatearTiempo(tiempoRestante)}</span>
        </div>
      ` : ""}

      <div class="bloque-info">
        <span class="bloque-etiqueta">${escaparHTML(item.bloque || "Bloque")}</span>
      </div>

      <h2 class="pregunta-titulo">${escaparHTML(item.pregunta)}</h2>

      <div class="opciones">
        ${item.opciones.map((opcion, i) => {
          const seleccionada = respuestaMarcada === i;
          const yaRespondida = respuestaMarcada !== null && typeof respuestaMarcada !== "undefined";

          let clases = "opcion";
          if (seleccionada) clases += " seleccionada";

          if (yaRespondida && i === correctaIndex) clases += " opcion-correcta";
          if (yaRespondida && seleccionada && i !== correctaIndex) clases += " opcion-incorrecta";

          return `
            <label class="${clases}">
              <input type="radio" name="respuesta" value="${i}" ${seleccionada ? "checked" : ""}>
              <span>${String.fromCharCode(65 + i)}. ${escaparHTML(opcion)}</span>
            </label>
          `;
        }).join("")}
      </div>

      <div class="feedback-wrap">
        ${crearHTMLFeedback(item, respuestaMarcada)}
      </div>

      <div class="nav-botones">
        <button id="btnVolverInicioDirecto" class="btn-secundario">⌂ Inicio</button>
        <button id="btnReiniciarIntento" class="btn-secundario">↻ Reiniciar</button>
        <button id="btnAnterior" class="btn-secundario" ${indiceActual === 0 ? "disabled" : ""}>← Anterior</button>
        <button id="btnGuardar" class="btn-secundario">Guardar respuesta</button>
        <button id="btnSiguiente" class="btn-principal">${indiceActual === preguntasActuales.length - 1 ? "Finalizar" : "Siguiente →"}</button>
      </div>
    </section>
  `;

  document.querySelectorAll('input[name="respuesta"]').forEach((input) => {
    input.addEventListener("change", (e) => {
      respuestasUsuario[indiceActual] = Number(e.target.value);
      guardarEstado();
      actualizarProgreso();
      renderPregunta();
    });
  });

  document.getElementById("btnVolverInicioDirecto").addEventListener("click", () => {
    pantallaInicio();
  });

  document.getElementById("btnReiniciarIntento").addEventListener("click", () => {
    reiniciarIntentoActual();
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

function reiniciarIntentoActual() {
  if (!preguntasActuales.length) {
    pantallaInicio();
    return;
  }

  if (modoActual === "examen") {
    preguntasActuales = mezclarArray(bancoPreguntas).slice(0, 30);
    respuestasUsuario = Array(preguntasActuales.length).fill(null);
    indiceActual = 0;
    tiempoRestante = 30 * 60;
    esModoExamen = true;
    guardarEstado();
    iniciarTemporizador();
    renderPregunta();
    return;
  }

  if (modoActual.startsWith("bloque-")) {
    const nombreBloque = modoActual.replace("bloque-", "");
    const preguntasDelBloque = bancoPreguntas.filter(
      (pregunta) => pregunta.bloque === nombreBloque
    );

    preguntasActuales = [...preguntasDelBloque];
    respuestasUsuario = Array(preguntasActuales.length).fill(null);
    indiceActual = 0;
    tiempoRestante = null;
    esModoExamen = false;
    detenerTemporizador();
    guardarEstado();
    renderPregunta();
    return;
  }

  if (modoActual === "simulador-aleatorio") {
    preguntasActuales = mezclarArray(bancoPreguntas);
  } else {
    preguntasActuales = [...bancoPreguntas];
  }

  respuestasUsuario = Array(preguntasActuales.length).fill(null);
  indiceActual = 0;
  tiempoRestante = null;
  esModoExamen = false;
  detenerTemporizador();
  guardarEstado();
  renderPregunta();
}

function mostrarRevision() {
  if (!preguntasActuales.length) {
    pantallaInicio();
    return;
  }

  ESTADO_MODO_EL.textContent = "Revisión del intento";

  QUIZ_EL.innerHTML = `
    <section class="card">
      <h2>Revisión del intento</h2>

      <div class="revision-lista">
        ${preguntasActuales.map((pregunta, i) => {
          const respuestaUsuario = respuestasUsuario[i];
          const correctaIndex = obtenerIndiceCorrecto(pregunta);
          const respondida = respuestaUsuario !== null && typeof respuestaUsuario !== "undefined";
          const acertada = respondida ? estaRespuestaBien(pregunta, respuestaUsuario) : false;

          const textoUsuario = respondida && pregunta.opciones[respuestaUsuario]
            ? `${String.fromCharCode(65 + respuestaUsuario)}. ${escaparHTML(pregunta.opciones[respuestaUsuario])}`
            : "No respondida";

          const textoCorrecta = correctaIndex >= 0 && pregunta.opciones[correctaIndex]
            ? `${String.fromCharCode(65 + correctaIndex)}. ${escaparHTML(pregunta.opciones[correctaIndex])}`
            : escaparHTML(String(pregunta.correcta));

          return `
            <article class="revision-item ${acertada ? "revision-ok" : "revision-ko"}">
              <div class="revision-top">
                <span class="bloque-etiqueta">${escaparHTML(pregunta.bloque || "Bloque")}</span>
                <span class="revision-estado">${acertada ? "✅ Correcta" : respondida ? "❌ Incorrecta" : "⏳ Sin responder"}</span>
              </div>

              <h3>${i + 1}. ${escaparHTML(pregunta.pregunta)}</h3>
              <p><strong>Tu respuesta:</strong> ${textoUsuario}</p>
              <p><strong>Respuesta correcta:</strong> ${textoCorrecta}</p>
              <p><strong>Explicación:</strong> ${escaparHTML(pregunta.explicacion || "Sin explicación disponible.")}</p>
            </article>
          `;
        }).join("")}
      </div>

      <div class="nav-botones">
        <button id="btnVolverResultados" class="btn-secundario">Volver a resultados</button>
        <button id="btnVolverInicioRevision" class="btn-principal">Volver al inicio</button>
      </div>
    </section>
  `;

  document.getElementById("btnVolverResultados").addEventListener("click", pantallaResultados);
  document.getElementById("btnVolverInicioRevision").addEventListener("click", pantallaInicio);

  actualizarProgresoFinal();
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
        <button id="btnMostrarRevision" class="btn-secundario">Revisar respuestas</button>
        <button id="btnIrRanking" class="btn-secundario">Ver ranking</button>
        <button id="btnVolverInicioResultados" class="btn-secundario">Volver al inicio</button>
      </div>
    </section>
  `;

  document.getElementById("btnRepetir").addEventListener("click", pantallaInicio);
  document.getElementById("btnMostrarRevision").addEventListener("click", mostrarRevision);
  document.getElementById("btnIrRanking").addEventListener("click", pantallaRanking);
  document.getElementById("btnVolverInicioResultados").addEventListener("click", pantallaInicio);

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
        <pre>const preguntasBloque1 = [
  {
    pregunta: "¿Texto?",
    opciones: ["A", "B", "C", "D"],
    correcta: 1,
    explicacion: "Motivo de la respuesta"
  }
];</pre>
      </section>
    `;
    return;
  }

  pantallaInicio();
  actualizarProgreso();
}

document.addEventListener("DOMContentLoaded", iniciarApp);
