let datosCSV = [];
const eficienciaPanel = 0.20; // 20% de eficiencia de los paneles solares
const horasSolPorMunicipio = {
  Valledupar: 5.7,
  Bogotá: 4.5,
  Medellín: 5.2,
  Bosconia: 5.8,
  Barranquilla: 5.9,
  Santa_Marta: 5.6
};

let graficoBarras, graficoPastel;

fetch('datos/datos_consumo_tarifas.csv')
  .then(response => response.text())
  .then(text => {
    const parsed = Papa.parse(text, { header: true, dynamicTyping: true });
    datosCSV = parsed.data.filter(fila => fila.Estrato);
  });

document.getElementById("formulario").addEventListener("submit", function (e) {
  e.preventDefault();

  const consumo = parseFloat(document.getElementById("consumo").value);
  const estrato = parseInt(document.getElementById("estrato").value);
  const municipio = document.getElementById("municipio").value;

  if (!horasSolPorMunicipio[municipio]) {
    alert("Municipio no válido.");
    return;
  }

  const fila = datosCSV.find(f => parseInt(f.Estrato) === estrato);
  if (!fila) {
    alert("No se encontraron datos para el estrato seleccionado.");
    return;
  }

  const tarifa = parseFloat(fila.Tarifa_kWh);
  const horasSol = horasSolPorMunicipio[municipio];
  const precioVenta = tarifa * 0.8; // pago por excedente: 80% de la tarifa

  const energiaGenerada = horasSol * eficienciaPanel * 30; // kWh al mes
  const energiaUtilizada = Math.min(energiaGenerada, consumo);
  const excedente = Math.max(energiaGenerada - consumo, 0);

  const ahorroPorUso = energiaUtilizada * tarifa;
  const ingresoPorExcedente = excedente * precioVenta;
  const ahorroTotal = ahorroPorUso + ingresoPorExcedente;

  const costoSinPaneles = consumo * tarifa;
  const costoConPaneles = (consumo - energiaUtilizada) * tarifa;

  const porcentajeCubierto = (energiaUtilizada / consumo) * 100;

  // Texto explicativo
  document.getElementById("texto-resultado").innerText =
    `En ${municipio}, con ${horasSol} h de sol al día y eficiencia del 20%:

- Generarías ${energiaGenerada.toFixed(2)} kWh/mes.
- Ahorras $${ahorroPorUso.toFixed(0)} COP al reemplazar energía de la red.
- Vendes ${excedente.toFixed(2)} kWh extra por $${ingresoPorExcedente.toFixed(0)} COP.
- Tu beneficio total es de $${ahorroTotal.toFixed(0)} COP al mes.
- Tu nuevo costo mensual sería de $${costoConPaneles.toFixed(0)} COP.
- Estás cubriendo aproximadamente el ${porcentajeCubierto.toFixed(1)}% de tu consumo.`;

  // Gráfico de barras: comparación económica
  const ctxBarras = document.getElementById("graficoBarras").getContext("2d");
  if (graficoBarras) graficoBarras.destroy();
  graficoBarras = new Chart(ctxBarras, {
    type: 'bar',
    data: {
      labels: ['Sin paneles', 'Ahorro por uso', 'Ingreso por excedente'],
      datasets: [{
        label: 'Valor en COP',
        data: [costoSinPaneles, ahorroPorUso, ingresoPorExcedente],
        backgroundColor: ['#e74c3c', '#2ecc71', '#3498db']
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