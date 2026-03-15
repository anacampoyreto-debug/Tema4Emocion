const bancoBloques = {
  1: typeof preguntasBloque1 !== "undefined" ? preguntasBloque1 : [],
  2: typeof preguntasBloque2 !== "undefined" ? preguntasBloque2 : [],
  3: typeof preguntasBloque3 !== "undefined" ? preguntasBloque3 : [],
  4: typeof preguntasBloque4 !== "undefined" ? preguntasBloque4 : [],
  5: typeof preguntasBloque5 !== "undefined" ? preguntasBloque5 : [],
  6: typeof preguntasBloque6 !== "undefined" ? preguntasBloque6 : [],
  7: typeof preguntasBloque7 !== "undefined" ? preguntasBloque7 : [],
  8: typeof preguntasBloque8 !== "undefined" ? preguntasBloque8 : [],
  9: typeof preguntasBloque9 !== "undefined" ? preguntasBloque9 : [],
  10: typeof preguntasBloque10 !== "undefined" ? preguntasBloque10 : [],
  11: typeof preguntasBloque11 !== "undefined" ? preguntasBloque11 : [],
  12: typeof preguntasBloque12 !== "undefined" ? preguntasBloque12 : [],
  13: typeof preguntasBloque13 !== "undefined" ? preguntasBloque13 : [],
  14: typeof preguntasBloque14 !== "undefined" ? preguntasBloque14 : [],
  15: typeof preguntasBloque15 !== "undefined" ? preguntasBloque15 : [],
  16: typeof preguntasBloque16 !== "undefined" ? preguntasBloque16 : [],
  17: typeof preguntasBloque17 !== "undefined" ? preguntasBloque17 : [],
  18: typeof preguntasBloque18 !== "undefined" ? preguntasBloque18 : [],
  19: typeof preguntasBloque19 !== "undefined" ? preguntasBloque19 : [],
  20: typeof preguntasBloque20 !== "undefined" ? preguntasBloque20 : []
};

function obtenerPreguntasBloque(numero) {
  return bancoBloques[numero] || [];
}

function obtenerTodasLasPreguntas() {
  return Object.values(bancoBloques).flat();
}

function mezclarArray(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}