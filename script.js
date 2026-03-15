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

function inicializarSelectorBloques() {
  const selector = document.getElementById("selectorBloque");
  selector.innerHTML = "";

  Object.keys(bancoBloques).forEach((num) => {
    if (bancoBloques[num] && bancoBloques[num].length > 0) {
      const option = document.createElement("option");
      option.value = num;
      option.textContent = `Bloque ${num} · ${bancoBloques[num].length} preguntas`;
      selector.appendChild(option);
    }
  });
}

function cargarBloque(num) {
  bloqueActual = parseInt(num, 10);
  preguntasActuales = [...bancoBloques[bloqueActual]];
  modo = "entrenamiento";
  indice = 0;
  correctas = 0;
  fallos = 0;
  respondidas = 0;
  detenerTemporizador();
  actualizarModoTexto();
  actualizarStats();
  document.getElementById("totalPreguntas").innerText = preguntasActuales.length;
  mostrarPregunta();
}

function cambiarBloque() {
  const num = document.getElementById("selectorBloque").value;
  cargarBloque(num);
}

function iniciarSimulacro() {
  const selector = document.getElementById("selectorBloque");
  const num = selector.value;
  bloqueActual = parseInt(num, 10);

  const base = [...bancoBloques[bloqueActual]];
  preguntasActuales = mezclarArray(base).slice(0, Math.min(20, base.length));

  modo = "simulacro";
  indice = 0;
  correctas = 0;
  fallos = 0;
  respondidas = 0;
  tiempoRestante = 20 * 60;
  actualizarModoTexto();
  actualizarStats();
  document.getElementById("totalPreguntas").innerText = preguntasActuales.length;
  iniciarTemporizador();
  mostrarPregunta();
}

function reiniciarSesion() {
  correctas = 0;
  fallos = 0;
  respondidas = 0;
  xp = 0;
  simulacrosCompletados = 0;
  detenerTemporizador();
  actualizarNivel();
  cargarBloque(document.getElementById("selectorBloque").value);
}

function mostrarPregunta() {
  if (preguntasActuales.length === 0) return;

  const p = preguntasActuales[indice];
  respondida = false;

  document.getElementById("numeroPregunta").innerText = indice + 1;
  document.getElementById("pregunta").innerHTML = p.pregunta;

  const feedback = document.getElementById("feedback");
  feedback.className = "feedback oculto";
  feedback.innerHTML = "";

  let opcionesHTML = "";
  p.opciones.forEach((opcion, i) => {
    opcionesHTML += `
      <button onclick="responder(${i})" id="opcion-${i}">
        ${String.fromCharCode(65 + i)}) ${opcion}
      </button>
    `;
  });

  document.getElementById("opciones").innerHTML = opcionesHTML;
  actualizarBarra();
}

function responder(i) {
  if (respondida) return;

  respondida = true;
  respondidas++;

  const botones = document.querySelectorAll("#opciones button");
  const pregunta = preguntasActuales[indice];
  const correcta = pregunta.correcta;

  botones.forEach((btn) => {
    btn.classList.add("bloqueada");
    btn.disabled = true;
  });

  const feedback = document.getElementById("feedback");
  feedback.classList.remove("oculto");

  if (i === correcta) {
    document.getElementById(`opcion-${i}`).classList.add("correcta");
    correctas++;
    xp += modo === "simulacro" ? 15 : 10;
    feedback.className = "feedback correcto";
    feedback.innerHTML = `
      <strong>✅ Correcto</strong><br>
      Has sumado ${modo === "simulacro" ? 15 : 10} XP.
      ${pregunta.explicacion ? `<br><br><strong>Explicación:</strong> ${pregunta.explicacion}` : ""}
    `;
  } else {
    document.getElementById(`opcion-${i}`).classList.add("incorrecta");
    document.getElementById(`opcion-${correcta}`).classList.add("correcta");
    fallos++;
    feedback.className = "feedback incorrecto";
    feedback.innerHTML = `
      <strong>❌ Incorrecto</strong><br>
      <strong>Respuesta correcta:</strong> ${String.fromCharCode(65 + correcta)}) ${pregunta.opciones[correcta]}
      ${pregunta.explicacion ? `<br><br><strong>Explicación:</strong> ${pregunta.explicacion}` : ""}
    `;
  }

  actualizarStats();
  actualizarNivel();
}

function siguientePregunta() {
  indice++;

  if (indice >= preguntasActuales.length) {
    finalizarSesion();
    return;
  }

  mostrarPregunta();
}

function finalizarSesion() {
  detenerTemporizador();

  if (modo === "simulacro") {
    simulacrosCompletados++;
  }

  alert(
    `${modo === "simulacro" ? "Simulacro completado" : "Bloque completado"}.\n\n` +
    `Aciertos: ${correctas}\n` +
    `Fallos: ${fallos}\n` +
    `XP acumulada: ${xp}`
  );

  actualizarStats();
  actualizarNivel();

  if (modo === "simulacro") {
    cargarBloque(document.getElementById("selectorBloque").value);
  } else {
    indice = 0;
    mostrarPregunta();
  }
}

function actualizarBarra() {
  const porcentaje = preguntasActuales.length > 0
    ? ((indice + 1) / preguntasActuales.length) * 100
    : 0;

  document.getElementById("progreso").style.width = porcentaje + "%";
  document.getElementById("porcentajeTexto").innerText = Math.round(porcentaje) + "% completado";
}

function actualizarStats() {
  document.getElementById("correctas").innerText = correctas;
  document.getElementById("respondidasTexto").innerText = respondidas;
  document.getElementById("fallosTexto").innerText = fallos;
  document.getElementById("xpTexto").innerText = xp;
  document.getElementById("simulacrosTexto").innerText = simulacrosCompletados;
}

function actualizarModoTexto() {
  document.getElementById("modoActual").innerText =
    modo === "simulacro" ? "Modo: simulacro UNED" : "Modo: entrenamiento";
}

function actualizarNivel() {
  const nivelTexto = document.getElementById("nivelTexto");

  if (xp < 100) {
    nivelTexto.innerText = "Apertura estratégica";
  } else if (xp < 250) {
    nivelTexto.innerText = "Exploradora táctica";
  } else if (xp < 500) {
    nivelTexto.innerText = "Arquitecta del dominio";
  } else if (xp < 900) {
    nivelTexto.innerText = "Estratega de alto rendimiento";
  } else {
    nivelTexto.innerText = "Maestra del tema";
  }
}

function iniciarTemporizador() {
  detenerTemporizador();
  actualizarTemporizadorTexto();

  temporizador = setInterval(() => {
    tiempoRestante--;
    actualizarTemporizadorTexto();

    if (tiempoRestante <= 0) {
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
  document.getElementById("timerTexto").innerText =
    modo === "simulacro" ? "Tiempo: 20:00" : "Tiempo: --:--";
}

function actualizarTemporizadorTexto() {
  const min = String(Math.floor(tiempoRestante / 60)).padStart(2, "0");
  const seg = String(tiempoRestante % 60).padStart(2, "0");
  document.getElementById("timerTexto").innerText = `Tiempo: ${min}:${seg}`;
}

function mezclarArray(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

inicializarSelectorBloques();
cargarBloque(1);