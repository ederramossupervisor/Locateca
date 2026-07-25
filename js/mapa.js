const MapaLeitura = (() => {
  let mapa = null;
  let marcadores = [];

  async function init() {
    const container = document.getElementById('mapa-locais');
    if (!container) return;

    if (!mapa) {
      mapa = L.map('mapa-locais').setView([-15.7934, -47.8822], 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapa);
    }

    await carregarLocaisNoMapa();

    document.getElementById('btn-atualizar-mapa')?.addEventListener('click', carregarLocaisNoMapa);
  }

  async function carregarLocaisNoMapa() {
    try {
      const locais = await API.enviar({ acao: 'listarLocais' });
      if (!Array.isArray(locais)) throw new Error('Resposta inválida');

      const configs = await API.enviar({ acao: 'getConfigs' });

      // Remove marcadores antigos
      marcadores.forEach(m => mapa.removeLayer(m));
      marcadores = [];

      for (const local of locais) {
        console.log(`Dados do local ${local.local}:`, local.ultimaCapa);
        const chave = `local_coord_${local.local.replace(/\s+/g, '_')}`;
        const coordenadaStr = configs[chave];
        if (!coordenadaStr) continue;

        const [lat, lng] = coordenadaStr.split(',').map(Number);
        if (isNaN(lat) || isNaN(lng)) continue;

        // Constrói o popup
        const popupHtml = `
          <div style="text-align:center;">
            ${local.ultimaCapa ? `<img src="${local.ultimaCapa}" alt="Capa" loading="lazy" style="width:50px; height:70px; object-fit:cover; border-radius:4px; margin-bottom:5px;">` : ''}
            <strong>${local.local}</strong><br>
            <hr class="my-1">
            <i class="fas fa-book-open"></i> Sessões: ${local.sessoes}<br>
            <i class="fas fa-file-alt"></i> Páginas: ${local.paginas}<br>
            <i class="fas fa-clock"></i> Horas: ${local.horas}<br>
            <i class="fas fa-layer-group"></i> Livros diferentes: ${local.livrosUnicos}
            ${local.ultimoLivro ? `<br><small><i class="fas fa-bookmark"></i> Último: ${local.ultimoLivro}</small>` : ''}
          </div>
        `;

        // Se tiver capa, cria ícone personalizado; senão, usa o padrão
        let marker;
        if (local.ultimaCapa) {
          const icone = L.icon({
            iconUrl: local.ultimaCapa,
            iconSize: [20, 28],
            iconAnchor: [10, 28],
            popupAnchor: [0, -28],
            className: 'icone-capa-marcador' // para CSS extra, se quiser
          });
          marker = L.marker([lat, lng], { icon: icone }).addTo(mapa);
        } else {
          marker = L.marker([lat, lng]).addTo(mapa);
        }

        marker.bindPopup(popupHtml);
        marcadores.push(marker);
      }

      if (marcadores.length > 0) {
        const grupo = L.featureGroup(marcadores);
        mapa.fitBounds(grupo.getBounds().pad(0.1));
      } else {
        mapa.setView([-15.7934, -47.8822], 4);
      }
    } catch (erro) {
      console.error('Erro ao carregar mapa:', erro);
      Util.toast('Falha ao carregar dados do mapa.', 'danger');
    }
  }

  return { init };
})();
