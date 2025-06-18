let datosCSV = [];
let datosMunicipios = [];
const eficienciaPanel = 0.20;

let graficoBarras, graficoPastel;

// Cargar tarifas por estrato
fetch('datos/datos_consumo_tarifas.csv')
  .then(response => response.text())
  .then(text => {
    const parsed = Papa.parse(text, { header: true, dynamicTyping: true });
    datosCSV = parsed.data.filter(fila => fila.Estrato);
  });

// Cargar horas de sol por municipio
function cargarHorasSolPorMunicipio() {
  fetch('datos/datos_horas_municipio.csv')
    .then(response => response.text())
    .then(text => {
      const parsed = Papa.parse(text, { header: true, dynamicTyping: true });
      datosMunicipios = parsed.data.filter(fila => fila.Municipio && fila.Horas_Sol);
    });
}

// Llamar la función al iniciar
cargarHorasSolPorMunicipio();

document.getElementById("formulario").addEventListener("submit", function (e) {
  e.preventDefault();

  const consumo = parseFloat(document.getElementById("consumo").value);
  const estrato = parseInt(document.getElementById("estrato").value);
  const municipio = document.getElementById("municipio").value;

  const filaMunicipio = datosMunicipios.find(m => m.Municipio === municipio);
  if (!filaMunicipio) {
    alert("Municipio no válido o no cargado.");
    return;
  }

  const horasSol = parseFloat(filaMunicipio.Horas_Sol);

  const fila = datosCSV.find(f => parseInt(f.Estrato) === estrato);
  if (!fila) {
    alert("No se encontraron datos para el estrato seleccionado.");
    return;
  }

  const tarifa = parseFloat(fila.Tarifa_kWh);

  const energiaGenerada = horasSol * eficienciaPanel * 30; // kWh al mes
  const energiaUtilizada = Math.min(energiaGenerada, consumo);

  const ahorroPorUso = energiaUtilizada * tarifa;

  const costoSinPaneles = consumo * tarifa;
  const costoConPaneles = (consumo - energiaUtilizada) * tarifa;
  const ahorroTotal = ahorroPorUso;

  const porcentajeCubierto = (energiaUtilizada / consumo) * 100;

  // Texto explicativo
  document.getElementById("texto-resultado").innerText =
    `En ${municipio}, con ${horasSol} h de sol al día y eficiencia del 20%:

- Generarías ${energiaGenerada.toFixed(2)} kWh/mes.
- Ahorras $${ahorroPorUso.toFixed(0)} COP al reemplazar energía de la red.
- Tu nuevo costo mensual sería de $${costoConPaneles.toFixed(0)} COP.
- Estás cubriendo aproximadamente el ${porcentajeCubierto.toFixed(1)}% de tu consumo.`;

  // Gráfico de barras: comparación económica
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

  // Gráfico pastel: porcentaje de cobertura
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
});