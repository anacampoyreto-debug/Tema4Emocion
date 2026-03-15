function guardarResultado(modo, aciertos, total, detalle = "") {
  const ranking = JSON.parse(localStorage.getItem("rankingPsicoTema4")) || [];
  const porcentaje = Math.round((aciertos / total) * 100);

  ranking.push({
    modo,
    aciertos,
    total,
    porcentaje,
    detalle,
    fecha: new Date().toLocaleString()
  });

  ranking.sort((a, b) => b.porcentaje - a.porcentaje);

  localStorage.setItem("rankingPsicoTema4", JSON.stringify(ranking));
}

function obtenerRanking() {
  return JSON.parse(localStorage.getItem("rankingPsicoTema4")) || [];
}

function borrarRanking() {
  localStorage.removeItem("rankingPsicoTema4");
  const rankingLista = document.getElementById("rankingLista");
  if (rankingLista) {
    rankingLista.innerHTML = "<p class='vacio'>Ranking borrado.</p>";
  }
}

function mostrarRanking() {
  const ranking = obtenerRanking();
  const rankingLista = document.getElementById("rankingLista");

  if (!rankingLista) return;

  if (ranking.length === 0) {
    rankingLista.innerHTML = `
      <div class="ranking-box">
        <h2>Ranking</h2>
        <p class="vacio">Todavía no hay resultados guardados.</p>
      </div>
    `;
    return;
  }

  rankingLista.innerHTML = `
    <div class="ranking-box">
      <h2>Ranking</h2>
      ${ranking.slice(0, 15).map((item, index) => `
        <div class="ranking-item">
          <div class="ranking-posicion">#${index + 1}</div>
          <div class="ranking-info">
            <strong>${item.modo}</strong>
            <span>${item.aciertos}/${item.total} · ${item.porcentaje}%</span>
            <small>${item.detalle ? item.detalle + " · " : ""}${item.fecha}</small>
          </div>
        </div>
      `).join("")}
      <button class="peligro" onclick="borrarRanking()">Borrar ranking</button>
    </div>
  `;
}