let bloqueActual = 1;
let preguntasActuales = [];
let indice = 0;
let correctas = 0;
let fallos = 0;
let respondida = false;
let xp = 0;
let respondidas = 0;
let simulacrosCompletados = 0;
let modo = "entrenamiento";
let temporizador = null;
let tiempoRestante = 0;

const STORAGE_CLAVE = "tema4_estado_bloques";

/* =========================
   UTILIDADES
========================= */

function $(id) {
  return document.getElementById(id);
}

function escaparHTML(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function mezclarArray(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function obtenerNivelTexto() {
  if (xp < 100) {
    return "Apertura estratégica";
  } else if (xp < 250) {
    return "Exploradora táctica";
  } else if (xp < 500) {
    return "Arquitecta del dominio";
  } else if (xp < 900) {
    return "Estratega de alto rendimiento";
  } else {
    return "Maestra del tema";
  }
}

function calcularNotaUNED() {
  if (!preguntasActuales.length) return 0;

  const puntuacion = correctas - (fallos * 0.33);
  const nota = (puntuacion / preguntasActuales.length) * 10;

  return Math.max(0, nota);
}

function guardarEstado() {
  const estado = {
    bloqueActual,
    preguntasActuales,
    indice,
    correctas,
    fallos,
    respondida,
    xp,
    respondidas,
    simulacrosCompletados,
    modo,
    tiempoRestante
  };

  localStorage.setItem(STORAGE_CLAVE, JSON.stringify(estado));
}

function cargarEstado() {
  const raw = localStorage.getItem(STORAGE_CLAVE);
  if (!raw) return false;

  try {
    const estado = JSON.parse(raw);
    if (!estado) return false;

    bloqueActual = estado.bloqueActual ?? 1;
    preguntasActuales = Array.isArray(estado.preguntasActuales) ? estado.preguntasActuales : [];
    indice = estado.indice ?? 0;
    correctas = estado.correctas ?? 0;
    fallos = estado.fallos ?? 0;
    respondida = estado.respondida ?? false;
    xp = estado.xp ?? 0;
    respondidas = estado.respondidas ?? 0;
    simulacrosCompletados = estado.simulacrosCompletados ?? 0;
    modo = estado.modo ?? "entrenamiento";
    tiempoRestante = estado.tiempoRestante ?? 0;

    return true;
  } catch {
    return false;
  }
}

function borrarEstado() {
  localStorage.removeItem(STORAGE_CLAVE);
}

/* =========================
   BLOQUES
========================= */

function inicializarSelectorBloques() {
  const selector = $("selectorBloque");
  if (!selector || typeof bancoBloques === "undefined") return;

  selector.innerHTML = "";

  Object.keys(bancoBloques).forEach((num) => {
    if (bancoBloques[num] && bancoBloques[num].length > 0) {
      const option = document.createElement("option");
      option.value = num;
      option.textContent = `Bloque ${num} · ${bancoBloques[num].length} preguntas`;
      selector.appendChild(option);
    }
  });

  selector.value = String(bloqueActual);
}

function cargarBloque(num) {
  if (typeof bancoBloques === "undefined" || !bancoBloques[num]) return;

  bloqueActual = parseInt(num, 10);
  preguntasActuales = [...bancoBloques[bloqueActual]];
  modo = "entrenamiento";
  indice = 0;
  correctas = 0;
  fallos = 0;
  respondidas = 0;
  respondida = false;
  tiempoRestante = 0;

  detenerTemporizador();
  actualizarModoTexto();
  actualizarStats();

  if ($("totalPreguntas")) {
    $("totalPreguntas").innerText = preguntasActuales.length;
  }

  guardarEstado();
  mostrarPregunta();
}

function cambiarBloque() {
  const selector = $("selectorBloque");
  if (!selector) return;
  cargarBloque(selector.value);
}

function iniciarSimulacro() {
  const selector = $("selectorBloque");
  if (!selector || typeof bancoBloques === "undefined") return;

  const num = selector.value;
  bloqueActual = parseInt(num, 10);

  const base = [...bancoBloques[bloqueActual]];
  preguntasActuales = mezclarArray(base).slice(0, Math.min(20, base.length));

  modo = "simulacro";
  indice = 0;
  correctas = 0;
  fallos = 0;
  respondidas = 0;
  respondida = false;
  tiempoRestante = 20 * 60;

  actualizarModoTexto();
  actualizarStats();

  if ($("totalPreguntas")) {
    $("totalPreguntas").innerText = preguntasActuales.length;
  }

  guardarEstado();
  iniciarTemporizador();
  mostrarPregunta();
}

function reiniciarSesion() {
  correctas = 0;
  fallos = 0;
  respondidas = 0;
  xp = 0;
  simulacrosCompletados = 0;
  respondida = false;
  tiempoRestante = 0;

  detenerTemporizador();
  actualizarNivel();

  const selector = $("selectorBloque");
  if (selector) {
    cargarBloque(selector.value);
  } else {
    cargarBloque(1);
  }
}

/* =========================
   PREGUNTAS
========================= */

function mostrarPregunta() {
  if (!preguntasActuales.length) return;
  if (indice < 0 || indice >= preguntasActuales.length) return;

  const p = preguntasActuales[indice];
  respondida = false;

  if ($("numeroPregunta")) {
    $("numeroPregunta").innerText = indice + 1;
  }

  if ($("pregunta")) {
    $("pregunta").innerHTML = escaparHTML(p.pregunta);
  }

  const feedback = $("feedback");
  if (feedback) {
    feedback.className = "feedback oculto";
    feedback.innerHTML = "";
  }

  let opcionesHTML = "";
  p.opciones.forEach((opcion, i) => {
    opcionesHTML += `
      <button onclick="responder(${i})" id="opcion-${i}">
        ${String.fromCharCode(65 + i)}) ${escaparHTML(opcion)}
      </button>
    `;
  });

  if ($("opciones")) {
    $("opciones").innerHTML = opcionesHTML;
  }

  actualizarBarra();
  guardarEstado();
}

function responder(i) {
  if (respondida) return;
  if (!preguntasActuales[indice]) return;

  respondida = true;
  respondidas++;

  const botones = document.querySelectorAll("#opciones button");
  const pregunta = preguntasActuales[indice];
  const correcta = pregunta.correcta;

  botones.forEach((btn) => {
    btn.classList.add("bloqueada");
    btn.disabled = true;
  });

  const feedback = $("feedback");
  if (feedback) {
    feedback.classList.remove("oculto");
  }

  if (i === correcta) {
    const btn = $(`opcion-${i}`);
    if (btn) btn.classList.add("correcta");

    correctas++;
    xp += modo === "simulacro" ? 15 : 10;

    if (feedback) {
      feedback.className = "feedback correcto";
      feedback.innerHTML = `
        <strong>✅ Correcto</strong><br>
        Has sumado ${modo === "simulacro" ? 15 : 10} XP.
        ${pregunta.explicacion ? `<br><br><strong>Explicación:</strong> ${escaparHTML(pregunta.explicacion)}` : ""}
      `;
    }
  } else {
    const btnIncorrecta = $(`opcion-${i}`);
    const btnCorrecta = $(`opcion-${correcta}`);

    if (btnIncorrecta) btnIncorrecta.classList.add("incorrecta");
    if (btnCorrecta) btnCorrecta.classList.add("correcta");

    fallos++;

    if (feedback) {
      feedback.className = "feedback incorrecto";
      feedback.innerHTML = `
        <strong>❌ Incorrecto</strong><br>
        <strong>Respuesta correcta:</strong> ${String.fromCharCode(65 + correcta)}) ${escaparHTML(pregunta.opciones[correcta])}
        ${pregunta.explicacion ? `<br><br><strong>Explicación:</strong> ${escaparHTML(pregunta.explicacion)}` : ""}
      `;
    }
  }

  actualizarStats();
  actualizarNivel();
  guardarEstado();
}

function siguientePregunta() {
  indice++;

  if (indice >= preguntasActuales.length) {
    finalizarSesion();
    return;
  }

  mostrarPregunta();
}

/* =========================
   FINAL
========================= */

function finalizarSesion() {
  detenerTemporizador();

  if (modo === "simulacro") {
    simulacrosCompletados++;
  }

  const notaUNED = calcularNotaUNED();

  alert(
    `${modo === "simulacro" ? "Simulacro completado" : "Bloque completado"}.\n\n` +
    `Aciertos: ${correctas}\n` +
    `Fallos: ${fallos}\n` +
    `Nota tipo UNED: ${notaUNED.toFixed(2)} / 10\n` +
    `XP acumulada: ${xp}`
  );

  actualizarStats();
  actualizarNivel();
  guardarEstado();

  if (modo === "simulacro") {
    const selector = $("selectorBloque");
    if (selector) {
      cargarBloque(selector.value);
    } else {
      cargarBloque(bloqueActual);
    }
  } else {
    indice = 0;
    mostrarPregunta();
  }
}

/* =========================
   INTERFAZ
========================= */

function actualizarBarra() {
  const porcentaje = preguntasActuales.length > 0
    ? ((indice + 1) / preguntasActuales.length) * 100
    : 0;

  if ($("progreso")) {
    $("progreso").style.width = porcentaje + "%";
  }

  if ($("porcentajeTexto")) {
    $("porcentajeTexto").innerText = Math.round(porcentaje) + "% completado";
  }
}

function actualizarStats() {
  if ($("correctas")) $("correctas").innerText = correctas;
  if ($("respondidasTexto")) $("respondidasTexto").innerText = respondidas;
  if ($("fallosTexto")) $("fallosTexto").innerText = fallos;
  if ($("xpTexto")) $("xpTexto").innerText = xp;
  if ($("simulacrosTexto")) $("simulacrosTexto").innerText = simulacrosCompletados;
}

function actualizarModoTexto() {
  if (!$("modoActual")) return;

  $("modoActual").innerText =
    modo === "simulacro" ? "Modo: simulacro UNED" : "Modo: entrenamiento";
}

function actualizarNivel() {
  const nivelTexto = $("nivelTexto");
  if (!nivelTexto) return;

  nivelTexto.innerText = obtenerNivelTexto();
}

/* =========================
   TEMPORIZADOR
========================= */

function iniciarTemporizador() {
  detenerTemporizador();
  actualizarTemporizadorTexto();

  temporizador = setInterval(() => {
    tiempoRestante--;
    actualizarTemporizadorTexto();
    guardarEstado();

    if (tiempoRestante <= 0) {
      tiempoRestante = 0;
      detenerTemporizador();
      alert("Tiempo agotado. Se cerrará el simulacro.");
      finalizarSesion();
    }
  }, 1000);
}

function detenerTemporizador() {
  if (temporizador) {
    clearInterval(temporizador);
    temporizador = null;
  }

  if ($("timerTexto")) {
    $("timerTexto").innerText =
      modo === "simulacro" ? "Tiempo: 20:00" : "Tiempo: --:--";
  }
}

function actualizarTemporizadorTexto() {
  const min = String(Math.floor(tiempoRestante / 60)).padStart(2, "0");
  const seg = String(tiempoRestante % 60).padStart(2, "0");

  if ($("timerTexto")) {
    $("timerTexto").innerText = `Tiempo: ${min}:${seg}`;
  }
}

/* =========================
   INICIO
========================= */

function iniciar() {
  inicializarSelectorBloques();

  const restaurado = cargarEstado();

  if (restaurado && preguntasActuales.length > 0) {
    inicializarSelectorBloques();
    actualizarStats();
    actualizarNivel();
    actualizarModoTexto();

    if ($("totalPreguntas")) {
      $("totalPreguntas").innerText = preguntasActuales.length;
    }

    if (modo === "simulacro" && tiempoRestante > 0) {
      iniciarTemporizador();
    } else {
      actualizarTemporizadorTexto();
    }

    mostrarPregunta();
    return;
  }

  cargarBloque(1);
  actualizarNivel();
}

iniciar();
