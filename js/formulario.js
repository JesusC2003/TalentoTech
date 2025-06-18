let datosCSV = [];
let datosMunicipios = [];

document.addEventListener("DOMContentLoaded", () => {
  cargarEstratosYTarifas();
  cargarMunicipios();
  document.getElementById("estrato").addEventListener("change", actualizarTarifa);
});

// Cargar datos de estratos y llenar el select
function cargarEstratosYTarifas() {
  fetch('datos/datos_consumo_tarifas.csv')
    .then(response => response.text())
    .then(text => {
      const parsed = Papa.parse(text, { header: true, dynamicTyping: true });
      datosCSV = parsed.data.filter(f => f.Estrato && f.Tarifa_kWh);

      const selectEstrato = document.getElementById("estrato");
      selectEstrato.innerHTML = '<option value="">Seleccione</option>'; // Reiniciar

      datosCSV.forEach(fila => {
        const valor = parseInt(fila.Estrato);
        const opcion = document.createElement("option");
        opcion.value = valor;
        opcion.textContent = `Estrato ${valor}`;
        selectEstrato.appendChild(opcion);
      });
    });
}

// Cargar municipios y llenar el select
function cargarMunicipios() {
  fetch('datos/datos_horas_municipio.csv')
    .then(response => response.text())
    .then(text => {
      const parsed = Papa.parse(text, { header: true, dynamicTyping: true });
      datosMunicipios = parsed.data.filter(f => f.Municipio);

      const selectMunicipio = document.getElementById("municipio");
      selectMunicipio.innerHTML = '<option value="">Seleccione</option>'; // Reiniciar

      datosMunicipios.forEach(fila => {
        const opcion = document.createElement("option");
        opcion.value = fila.Municipio;
        opcion.textContent = fila.Municipio;
        selectMunicipio.appendChild(opcion);
      });
    });
}

// Mostrar tarifa asociada al estrato seleccionado
function actualizarTarifa() {
  const estratoSeleccionado = parseInt(document.getElementById("estrato").value);
  const campoTarifa = document.getElementById("tarifa");

  const fila = datosCSV.find(f => parseInt(f.Estrato) === estratoSeleccionado);
  if (fila) {
    campoTarifa.value = fila.Tarifa_kWh.toFixed(2);
  } else {
    campoTarifa.value = '';
  }
}
