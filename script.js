let datosCSV = [];
const eficienciaPanel = 0.20; // 20% de eficiencia de los paneles solares
const horasSolPorMunicipio = {
  Valledupar:6.2,
  Aguachica:5.8,
  Codazzi:6.1,
  La_Jagua_de_Ibirico:6.0,
  Bosconia:5.9,
  Chimichagua:6.0,
  Curumaní:5.9,
  El_Copey:5.7,
  Pueblo_Bello:5.7,
  San_Alberto:6.0
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

  // Gráfico de barras actualizado
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

  // Gráfico pastel
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
