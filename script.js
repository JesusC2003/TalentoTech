let datosCSV = [];
let datosMunicipios = [];
let graficoBarras, graficoPastel;

function cargarTarifasPorEstrato() {
  fetch('datos/datos_consumo_tarifas.csv')
    .then(response => response.text())
    .then(text => {
      const parsed = Papa.parse(text, { header: true, dynamicTyping: true });
      datosCSV = parsed.data.filter(fila => fila.Estrato);
    });
}

function cargarHorasSolPorMunicipio() {
  fetch('datos/datos_horas_municipio.csv')
    .then(response => response.text())
    .then(text => {
      const parsed = Papa.parse(text, { header: true, dynamicTyping: true });
      datosMunicipios = parsed.data.filter(fila => fila.Municipio && fila.Horas_Sol);
    });
}

function obtenerHorasSol(municipio) {
  const filaMunicipio = datosMunicipios.find(m => m.Municipio === municipio);
  return filaMunicipio ? parseFloat(filaMunicipio.Horas_Sol) : null;
}

function obtenerTarifa(estrato) {
  const fila = datosCSV.find(f => parseInt(f.Estrato) === estrato);
  return fila ? parseFloat(fila.Tarifa_kWh) : null;
}

function mostrarResultados({
  municipio,
  horasSol,
  eficienciaPanel,
  energiaGenerada,
  ahorroPorUso,
  costoConPaneles,
  porcentajeCubierto,
  costoSinPaneles
}) {
  document.getElementById("texto-resultado").innerText =
    `En ${municipio}, con ${horasSol} h de sol al día y eficiencia del ${eficienciaPanel * 100}%:

- Tu factura sin paneles sería de $${costoSinPaneles.toFixed(0)} COP.
- Generarías ${energiaGenerada.toFixed(2)} kWh/mes.
- Ahorras $${ahorroPorUso.toFixed(0)} COP al reemplazar energía de la red.
- Tu nuevo costo mensual sería de $${costoConPaneles.toFixed(0)} COP.
- Estás cubriendo aproximadamente el ${porcentajeCubierto.toFixed(1)}% de tu consumo.`;
}

function graficarBarras(costoSinPaneles, costoConPaneles, ahorroTotal) {
  const ctxBarras = document.getElementById("graficoBarras").getContext("2d");
  if (graficoBarras) graficoBarras.destroy();
  graficoBarras = new Chart(ctxBarras, {
    type: 'bar',
    data: {
      labels: ['Sin paneles', 'Con paneles', 'Ahorro'],
      datasets: [{
        label: 'Valor en COP',
        data: [costoSinPaneles, costoConPaneles, ahorroTotal],
        backgroundColor: ['#e74c3c', '#3498db', '#2ecc71']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `$${ctx.raw.toFixed(0)} COP`
          }
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function graficarPastel(energiaUtilizada, consumo) {
  const ctxPastel = document.getElementById("graficoPastel").getContext("2d");
  if (graficoPastel) graficoPastel.destroy();
  graficoPastel = new Chart(ctxPastel, {
    type: 'doughnut',
    data: {
      labels: ['Cubierto por paneles', 'No cubierto'],
      datasets: [{
        data: [energiaUtilizada, consumo - energiaUtilizada],
        backgroundColor: ['#27ae60', '#f39c12']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const valor = ctx.dataset.data[ctx.dataIndex];
              const porcentaje = (valor / total * 100).toFixed(1);
              return `${ctx.label}: ${valor.toFixed(1)} kWh (${porcentaje}%)`;
            }
          }
        }
      }
    }
  });
}

function manejarFormulario(event) {
  event.preventDefault();

  const consumo = parseFloat(document.getElementById("consumo").value);
  const estrato = parseInt(document.getElementById("estrato").value);
  const municipio = document.getElementById("municipio").value;
  const eficienciaPanel = parseFloat(document.getElementById("panel").value);

  const horasSol = obtenerHorasSol(municipio);
  if (horasSol === null) {
    alert("Municipio no válido o no cargado.");
    return;
  }

  const tarifa = obtenerTarifa(estrato);
  if (tarifa === null) {
    alert("No se encontraron datos para el estrato seleccionado.");
    return;
  }

  const energiaGenerada = horasSol * eficienciaPanel * 30;
  const energiaUtilizada = Math.min(energiaGenerada, consumo);
  const ahorroPorUso = energiaUtilizada * tarifa;

  const costoSinPaneles = consumo * tarifa;
  const costoConPaneles = (consumo - energiaUtilizada) * tarifa;
  const ahorroTotal = ahorroPorUso;
  const porcentajeCubierto = (energiaUtilizada / consumo) * 100;

  mostrarResultados({
    municipio,
    horasSol,
    eficienciaPanel,
    energiaGenerada,
    ahorroPorUso,
    costoConPaneles,
    porcentajeCubierto,
    costoSinPaneles
  });

  graficarBarras(costoSinPaneles, costoConPaneles, ahorroTotal);
  graficarPastel(energiaUtilizada, consumo);
}

// Inicialización
cargarTarifasPorEstrato();
cargarHorasSolPorMunicipio();
document.getElementById("formulario").addEventListener("submit", manejarFormulario);