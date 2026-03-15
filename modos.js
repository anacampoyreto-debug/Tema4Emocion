let preguntasActuales = [];
let indicePreguntaActual = 0;
let aciertos = 0;
let errores = 0;
let modoActual = "";
let bloqueActual = null;
let respuestasUsuario = [];

function iniciarEntrenamiento(numeroBloque) {
  const preguntas = obtenerPreguntasBloque(numeroBloque);

  if (!preguntas.length) {
    alert("Ese bloque no tiene preguntas cargadas.");
    return;
  }

  modoActual = "Entrenamiento";
  bloqueActual = numeroBloque;
  preguntasActuales = [...preguntas];
  indicePreguntaActual = 0;
  aciertos = 0;
  errores = 0;
  respuestasUsuario = [];

  renderPregunta();
  actualizarCabeceraModo(`Entrenamiento · Bloque ${numeroBloque}`);
}

function iniciarExamenUNED() {
  const todas = obtenerTodasLasPreguntas();

  if (!todas.length) {
    alert("No hay preguntas cargadas.");
    return;
  }

  modoActual = "Examen UNED";
  bloqueActual = null;
  preguntasActuales = mezclarArray(todas).slice(0, 40);
  indicePreguntaActual = 0;
  aciertos = 0;
  errores = 0;
  respuestasUsuario = [];

  renderPregunta();
  actualizarCabeceraModo("Examen UNED · 40 preguntas aleatorias");
}

function iniciarExamenBloque(numeroBloque) {
  const preguntas = obtenerPreguntasBloque(numeroBloque);

  if (!preguntas.length) {
    alert("Ese bloque no tiene preguntas cargadas.");
    return;
  }

  modoActual = "Examen por bloque";
  bloqueActual = numeroBloque;
  preguntasActuales = mezclarArray(preguntas).slice(0, Math.min(20, preguntas.length));
  indicePreguntaActual = 0;
  aciertos = 0;
  errores = 0;
  respuestasUsuario = [];

  renderPregunta();
  actualizarCabeceraModo(`Examen Bloque ${numeroBloque}`);
}

function actualizarCabeceraModo(texto) {
  const estadoModo = document.getElementById("estadoModo");
  if (estadoModo) estadoModo.textContent = texto;
}

function renderPregunta() {
  const quiz = document.getElementById("quiz");
  const progresoTexto = document.getElementById("progresoTexto");
  const barra = document.getElementById("barraProgreso");

  if (!quiz) return;

  if (indicePreguntaActual >= preguntasActuales.length) {
    mostrarResultadoFinal();
    return;
  }

  const q = preguntasActuales[indicePreguntaActual];
  const progreso = Math.round((indicePreguntaActual / preguntasActuales.length) * 100);

  if (progresoTexto) {
    progresoTexto.textContent = `Pregunta ${indicePreguntaActual + 1} de ${preguntasActuales.length}`;
  }

  if (barra) {
    barra.style.width = `${progreso}%`;
  }

  quiz.innerHTML = `
    <div class="card-pregunta">
      <div class="pregunta-numero">Pregunta ${indicePreguntaActual + 1}</div>
      <h2 class="pregunta-texto">${q.pregunta}</h2>
      <div class="opciones">
        ${q.opciones.map((opcion, i) => `
          <button class="opcion-btn" onclick="responderPregunta(${i})">
            ${String.fromCharCode(65 + i)}. ${opcion}
          </button>
        `).join("")}
      </div>
      <div id="feedback" class="feedback"></div>
    </div>
  `;
}

function responderPregunta(indiceSeleccionado) {
  const q = preguntasActuales[indicePreguntaActual];
  const feedback = document.getElementById("feedback");
  const botones = document.querySelectorAll(".opcion-btn");

  botones.forEach(btn => btn.disabled = true);

  const esCorrecta = indiceSeleccionado === q.correcta;

  respuestasUsuario.push({
    pregunta: q.pregunta,
    seleccionada: indiceSeleccionado,
    correcta: q.correcta,
    explicacion: q.explicacion || ""
  });

  botones.forEach((btn, i) => {
    if (i === q.correcta) btn.classList.add("correcta");
    if (i === indiceSeleccionado && i !== q.correcta) btn.classList.add("incorrecta");
  });

  if (esCorrecta) {
    aciertos++;
    feedback.innerHTML = `
      <div class="feedback-ok">
        ✅ Correcta
        <p>${q.explicacion || ""}</p>
      </div>
    `;
  } else {
    errores++;
    feedback.innerHTML = `
      <div class="feedback-ko">
        ❌ Incorrecta
        <p><strong>Respuesta correcta:</strong> ${String.fromCharCode(65 + q.correcta)}. ${q.opciones[q.correcta]}</p>
        <p>${q.explicacion || ""}</p>
      </div>
    `;
  }

  feedback.innerHTML += `<button class="siguiente-btn" onclick="siguientePregunta()">Siguiente</button>`;
}

function siguientePregunta() {
  indicePreguntaActual++;
  renderPregunta();
}

function mostrarResultadoFinal() {
  const quiz = document.getElementById("quiz");
  const progresoTexto = document.getElementById("progresoTexto");
  const barra = document.getElementById("barraProgreso");

  const total = preguntasActuales.length;
  const porcentaje = total ? Math.round((aciertos / total) * 100) : 0;
  const detalle = bloqueActual ? `Bloque ${bloqueActual}` : "Aleatorio";

  if (progresoTexto) {
    progresoTexto.textContent = `Completado: ${aciertos}/${total}`;
  }

  if (barra) {
    barra.style.width = "100%";
  }

  guardarResultado(modoActual, aciertos, total, detalle);

  if (!quiz) return;

  quiz.innerHTML = `
    <div class="resultado-final">
      <h2>Resultado final</h2>
      <p><strong>Modo:</strong> ${modoActual}</p>
      <p><strong>Detalle:</strong> ${detalle}</p>
      <p><strong>Aciertos:</strong> ${aciertos}</p>
      <p><strong>Errores:</strong> ${errores}</p>
      <p><strong>Porcentaje:</strong> ${porcentaje}%</p>

      <div class="resultado-botones">
        <button onclick="reiniciarVista()">Volver al inicio</button>
        <button onclick="mostrarRevision()">Revisar respuestas</button>
        <button onclick="mostrarRanking()">Ver ranking</button>
      </div>

      <div id="rankingLista"></div>
    </div>
  `;
}

function mostrarRevision() {
  const quiz = document.getElementById("quiz");
  if (!quiz) return;

  quiz.innerHTML = `
    <div class="revision">
      <h2>Revisión del intento</h2>
      ${respuestasUsuario.map((r, i) => `
        <div class="revision-item">
          <h3>${i + 1}. ${r.pregunta}</h3>
          <p><strong>Tu respuesta:</strong> ${String.fromCharCode(65 + r.seleccionada)}</p>
          <p><strong>Correcta:</strong> ${String.fromCharCode(65 + r.correcta)}</p>
          <p>${r.explicacion}</p>
        </div>
      `).join("")}
      <button onclick="reiniciarVista()">Volver al inicio</button>
    </div>
  `;
}

function reiniciarVista() {
  const quiz = document.getElementById("quiz");
  const progresoTexto = document.getElementById("progresoTexto");
  const barra = document.getElementById("barraProgreso");

  if (progresoTexto) progresoTexto.textContent = "Sin iniciar";
  if (barra) barra.style.width = "0%";

  actualizarCabeceraModo("Elige un modo de estudio");

  if (!quiz) return;

  quiz.innerHTML = `
    <div class="panel-inicio">
      <h2>Elige tu modo</h2>
      <div class="panel-botones">
        <button onclick="iniciarExamenUNED()">Modo examen UNED</button>
        <button onclick="mostrarSelectorBloques()">Modo entrenamiento</button>
        <button onclick="mostrarRanking()">Ranking</button>
      </div>
      <div id="selectorBloques"></div>
      <div id="rankingLista"></div>
    </div>
  `;
}

function mostrarSelectorBloques() {
  const contenedor = document.getElementById("selectorBloques");
  if (!contenedor) return;

  contenedor.innerHTML = `
    <div class="selector-bloques-grid">
      ${Array.from({ length: 20 }, (_, i) => `
        <button onclick="iniciarEntrenamiento(${i + 1})">Entrenar bloque ${i + 1}</button>
      `).join("")}
      ${Array.from({ length: 20 }, (_, i) => `
        <button class="secundario" onclick="iniciarExamenBloque(${i + 1})">Examen bloque ${i + 1}</button>
      `).join("")}
    </div>
  `;
}