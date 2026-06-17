/**
 * Mapa Cultural de Mari - Script Principal
 * Lógica modular, assíncrona, integrada ao Google Planilhas com fallback local.
 */

// --- CONFIGURAÇÃO DO GOOGLE PLANILHAS ---
// Cole aqui as URLs de publicação em formato CSV para cada aba da sua Planilha Google.
// Se deixadas em branco (''), o site carregará automaticamente os arquivos JSON locais da pasta 'data/'.
const URL_PLANILHA_AGENTES = '';
const URL_PLANILHA_PONTOS = '';
const URL_PLANILHA_OPORTUNIDADES = '';

document.addEventListener('DOMContentLoaded', () => {
    // Inicialização dos módulos do site
    initNavbar();
    initMap();
    initAgentes();
    initAgentesPreview();
    initOportunidades();
    initOportunidadesPreview();
});

/**
 * FUNÇÃO HÍBRIDA DE CARREGAMENTO DE DADOS
 * Tenta buscar da Planilha Google (via PapaParse). Se der erro ou se a URL
 * estiver vazia, faz o fallback para o arquivo JSON local do projeto.
 */
async function buscarDados(urlPlanilha, urlLocalFallback) {
    if (urlPlanilha && urlPlanilha.trim() !== '') {
        try {
            // Garante que o PapaParse está disponível
            if (typeof Papa !== 'undefined') {
                return await new Promise((resolve, reject) => {
                    Papa.parse(urlPlanilha, {
                        download: true,
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => {
                            if (results.errors && results.errors.length > 0) {
                                console.warn('Erros menores ao analisar CSV:', results.errors);
                            }
                            resolve(results.data);
                        },
                        error: (error) => {
                            reject(error);
                        }
                    });
                });
            } else {
                console.warn('PapaParse não carregado. Usando fallback local.');
            }
        } catch (error) {
            console.warn(`Erro ao carregar dados da planilha (${urlPlanilha}). Carregando backup local.`, error);
        }
    }

    // Carregamento local JSON tradicional (fallback)
    const response = await fetch(urlLocalFallback);
    if (!response.ok) {
        throw new Error(`Não foi possível ler os dados locais em: ${urlLocalFallback}`);
    }
    return await response.json();
}

/**
 * 1. CONTROLE DO MENU HAMBÚRGUER (MOBILE)
 * Gerencia a abertura e fechamento da gaveta de navegação mobile.
 */
function initNavbar() {
    const hamburgerButton = document.querySelector('.hamburger-button');
    const mobileNav = document.querySelector('.mobile-nav');
    const closeButton = document.querySelector('.close-button');

    if (!hamburgerButton || !mobileNav || !closeButton) return;

    const abrirMenu = () => mobileNav.classList.add('mobile-nav-open');
    const fecharMenu = () => mobileNav.classList.remove('mobile-nav-open');

    hamburgerButton.addEventListener('click', abrirMenu);
    closeButton.addEventListener('click', fecharMenu);

    // Fecha a navegação ao clicar em qualquer link (útil para links âncoras na mesma página)
    mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', fecharMenu);
    });
}

/**
 * 2. MAPA INTERATIVO (LEAFLET)
 * Inicializa o mapa com Leaflet e carrega pontos da planilha (ou pontos.json local).
 */
function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Garante que o Leaflet (L) está carregado no escopo global
    if (typeof L === 'undefined') {
        console.warn('Leaflet não foi carregado nesta página.');
        return;
    }

    // Configuração inicial do mapa centrado em Mari-PB
    const map = L.map('map').setView([-7.059800, -35.317108], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const markerLayer = L.layerGroup().addTo(map);
    let allSpots = [];

    // Função para renderizar os marcadores baseados em filtro
    function renderMarkers(categoryFilter) {
        markerLayer.clearLayers();

        const filtered = (categoryFilter === 'todos')
            ? allSpots
            : allSpots.filter(spot => spot.category === categoryFilter);

        filtered.forEach(spot => {
            const lat = parseFloat(spot.lat);
            const lng = parseFloat(spot.lng);

            // Validação de coordenadas para evitar erros na renderização do mapa
            if (isNaN(lat) || isNaN(lng)) {
                console.warn(`Ponto com coordenadas inválidas ignorado: ${spot.name}`);
                return;
            }

            const marker = L.marker([lat, lng]);
            marker.bindPopup(`<b>${spot.name}</b><br>${spot.description}`);
            markerLayer.addLayer(marker);
        });
    }

    // Carrega os dados usando a função híbrida
    buscarDados(URL_PLANILHA_PONTOS, 'data/pontos.json')
        .then(data => {
            allSpots = data;
            renderMarkers('todos');
        })
        .catch(err => {
            console.error('Erro ao inicializar pontos no mapa:', err);
            mapContainer.innerHTML = '<div style="padding: 20px; text-align:center;">Não foi possível carregar os pontos do mapa no momento.</div>';
        });

    // Filtros do Mapa
    const filterButtons = document.querySelectorAll('.btn--filter');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderMarkers(button.dataset.category);
        });
    });
}

/**
 * 3. LISTAGEM COMPLETA DE AGENTES CULTURAIS COM PAGINAÇÃO
 * Carrega agentes da planilha (ou agentes.json local) e exibe-os paginados.
 */
function initAgentes() {
    const gridContainer = document.querySelector('.agentes-grid');
    const paginationContainer = document.querySelector('.pagination-container');

    if (!gridContainer || !paginationContainer) return;

    let agentes = [];
    let paginaAtual = 1;
    const itensPorPagina = 6; // Ajustável

    function displayPage(pagina) {
        paginaAtual = pagina;
        gridContainer.innerHTML = '';

        const inicio = (pagina - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const agentesPaginados = agentes.slice(inicio, fim);

        if (agentesPaginados.length === 0) {
            gridContainer.innerHTML = '<p class="text-center w-100">Nenhum agente cultural cadastrado.</p>';
            return;
        }

        agentesPaginados.forEach(agente => {
            const cardHTML = `
                <div class="agente-card">
                    <div class="agente-foto">
                        <img src="${agente.foto}" alt="Foto de ${agente.nome}" loading="lazy">
                    </div>
                    <div class="agente-info">
                        <h3>${agente.nome}</h3>
                        <p>${agente.biografia}</p>
                    </div>
                </div>
            `;
            gridContainer.insertAdjacentHTML('beforeend', cardHTML);
        });

        setupPagination();
    }

    function setupPagination() {
        paginationContainer.innerHTML = '';
        const totalPaginas = Math.ceil(agentes.length / itensPorPagina);
        if (totalPaginas <= 1) return;

        // Botão Anterior
        const btnAnterior = document.createElement('button');
        btnAnterior.innerText = 'Anterior';
        btnAnterior.classList.add('pagination-button');
        if (paginaAtual === 1) btnAnterior.classList.add('disabled');
        btnAnterior.addEventListener('click', () => {
            if (paginaAtual > 1) displayPage(paginaAtual - 1);
        });
        paginationContainer.appendChild(btnAnterior);

        // Páginas numeradas
        for (let i = 1; i <= totalPaginas; i++) {
            const btnPagina = document.createElement('button');
            btnPagina.innerText = i;
            btnPagina.classList.add('pagination-button');
            if (i === paginaAtual) btnPagina.classList.add('active');
            btnPagina.addEventListener('click', () => displayPage(i));
            paginationContainer.appendChild(btnPagina);
        }

        // Botão Próximo
        const btnProximo = document.createElement('button');
        btnProximo.innerText = 'Próximo';
        btnProximo.classList.add('pagination-button');
        if (paginaAtual === totalPaginas) btnProximo.classList.add('disabled');
        btnProximo.addEventListener('click', () => {
            if (paginaAtual < totalPaginas) displayPage(paginaAtual + 1);
        });
        paginationContainer.appendChild(btnProximo);
    }

    // Carrega dados da planilha ou do local fallback
    buscarDados(URL_PLANILHA_AGENTES, 'data/agentes.json')
        .then(data => {
            agentes = data;
            displayPage(1);
        })
        .catch(err => {
            console.error('Erro ao carregar agentes:', err);
            gridContainer.innerHTML = '<p class="text-center w-100 text-danger">Erro ao carregar a lista de agentes.</p>';
        });
}

/**
 * 4. PREVIEW DE AGENTES (HOMEPAGE)
 * Exibe as fotos dos agentes cadastrados na homepage de forma dinâmica.
 */
function initAgentesPreview() {
    const previewContainer = document.querySelector('.agentes-fotos-preview');
    if (!previewContainer) return;

    buscarDados(URL_PLANILHA_AGENTES, 'data/agentes.json')
        .then(data => {
            previewContainer.innerHTML = '';
            // Mostra no máximo as fotos dos 5 primeiros agentes cadastrados
            const maxPreview = data.slice(0, 5);
            maxPreview.forEach(agente => {
                if (agente.foto && agente.foto.trim() !== '') {
                    const img = document.createElement('img');
                    img.src = agente.foto;
                    img.alt = `Foto de ${agente.nome}`;
                    img.loading = 'lazy';
                    previewContainer.appendChild(img);
                }
            });
        })
        .catch(err => console.error('Erro no preview de agentes:', err));
}

/**
 * 5. LISTAGEM DE OPORTUNIDADES E EDITAIS
 * Carrega editais da planilha (ou oportunidades.json local) e os exibe.
 */
function initOportunidades() {
    const listContainer = document.querySelector('.editais-list');
    if (!listContainer) return;

    buscarDados(URL_PLANILHA_OPORTUNIDADES, 'data/oportunidades.json')
        .then(data => {
            listContainer.innerHTML = '';
            if (data.length === 0) {
                listContainer.innerHTML = '<p class="text-center w-100">Não há editais ou oportunidades disponíveis no momento.</p>';
                return;
            }

            data.forEach(edital => {
                const statusTexto = edital.status === 'aberto' ? 'Inscrições Abertas' : 'Encerrado';
                const statusClasse = edital.status === 'aberto' ? 'status-aberto' : 'status-encerrado';
                const botaoTexto = edital.status === 'aberto' ? 'Ler o Edital e Inscrever-se' : 'Ver Resultados';

                const cardHTML = `
                    <div class="edital-card">
                        <span class="status-badge ${statusClasse}">${statusTexto}</span>
                        <h3>${edital.titulo}</h3>
                        <p>${edital.descricao}</p>
                        <a href="${edital.link}" class="btn btn--primary" target="_blank">${botaoTexto}</a>
                    </div>
                `;
                listContainer.insertAdjacentHTML('beforeend', cardHTML);
            });
        })
        .catch(err => {
            console.error('Erro ao renderizar oportunidades:', err);
            listContainer.innerHTML = '<p class="text-center w-100 text-danger">Falha ao obter oportunidades da base de dados.</p>';
        });
}

/**
 * 6. PREVIEW DE OPORTUNIDADES (HOMEPAGE)
 * Exibe as 3 oportunidades mais recentes em formato resumido.
 */
function initOportunidadesPreview() {
    const listContainer = document.querySelector('.editais-preview-list');
    if (!listContainer) return;

    buscarDados(URL_PLANILHA_OPORTUNIDADES, 'data/oportunidades.json')
        .then(data => {
            listContainer.innerHTML = '';
            // Pega no máximo as 3 últimas oportunidades
            const ultimosEditais = data.slice(0, 3);

            if (ultimosEditais.length === 0) {
                listContainer.innerHTML = '<p>Nenhuma oportunidade cadastrada no momento.</p>';
                return;
            }

            ultimosEditais.forEach(edital => {
                const statusTexto = edital.status === 'aberto' ? 'Aberto' : 'Encerrado';
                const statusClasse = edital.status === 'aberto' ? 'status-aberto' : 'status-encerrado';

                const itemHTML = `
                    <div class="edital-preview-item">
                        <span class="status-badge ${statusClasse}">${statusTexto}</span>
                        <p>${edital.titulo}</p>
                    </div>
                `;
                listContainer.insertAdjacentHTML('beforeend', itemHTML);
            });
        })
        .catch(err => console.error('Erro no preview de oportunidades:', err));
}