// Aguarda o conteúdo da página ser carregado para executar o script
document.addEventListener('DOMContentLoaded', function() {
    const agentesCulturais = [
        /*{
            foto: 'https://i.pravatar.cc/150?img=68',
            nome: 'Lourival Oliveira',
            biografia: 'Paraibano de Patos, nascido em junho de 1918, Lourival Oliveira é autor de alguns dos mais memoráveis frevos-de-rua da história deste gênero musical.'
        },
        EXEMPLO DE AGENTE CULTURAL*/
        {
            foto: 'imagens/dudu.jpg',
            nome: 'José Eduardo (Dudu)',
            biografia: 'José Eduardo(Dudu) é natural da cidade de Marí-PB onde iniciou seus estudos de música em 1999 na Banda de música da cidade, é Bacharel em Trombone pela UPFB, licenciado em música pelo instituto Zayn, pós graduando em psicomotricidade e educação especial, também pelo instituto Zayn. Teve como orientador o Prof°  Me Sandoval Moreno,  participou de vários festivais locais da ATPB. ABT, atuou como trombonista em vários grupos musicais locais e Bandas, tais como  Experimental Jazz Band, Quarteto Trombombando, Orquestra de Metais e Percussão do Estado da Paraíba, Banda Marcial SEDEC, Banda de Música Santa Cecília, Sapé-PB, Banda Sinfônica José Siqueira da UFPB, Banda Marcial SEDEC Sênior, Quinteto São Francisco JP, Paraibones, Foi professor(Monitor) Da Banda Sinfônica da SEDEC, entre outros, chefe de naipe da Banda Marcial Paraíba. Atualmente é Trombonista da Orquestra SEDEC , também é  professor de música da rede municipal estadual de ensino e Gerente de Politicas publicas e patrimônio histórico da cidade de Mari-PB.'
        },
    ];

    // 2. FUNÇÃO PARA CRIAR OS CARDS NA TELA
    function renderizarAgentes() {
        const gridContainer = document.querySelector('.agentes-grid');
        if (!gridContainer) return; 

        // Limpa o container antes de adicionar novos cards
        gridContainer.innerHTML = '';

        agentesCulturais.forEach(agente => {
            const cardHTML = `
                <div class="agente-card">
                    <div class="agente-foto">
                        <img src="${agente.foto}" alt="Foto de ${agente.nome}">
                    </div>
                    <div class="agente-info">
                        <h3>${agente.nome}</h3>
                        <p>${agente.biografia}</p>
                    </div>
                </div>
            `;
            gridContainer.innerHTML += cardHTML;
        });
    }

    // 3. CHAMA A FUNÇÃO PARA RENDERIZAR QUANDO A PÁGINA CARREGAR
let paginaAtual = 1;
const itensPorPagina = 10; // Defina quantos agentes aparecerão por página

// 2. A nova função para renderizar, agora chamada `displayPage`
function displayPage(pagina) {
    const gridContainer = document.querySelector('.agentes-grid');
    const paginationContainer = document.querySelector('.pagination-container');
    
    // Se não estiver na página de agentes, não faz nada.
    if (!gridContainer || !paginationContainer) return;

    paginaAtual = pagina;
    gridContainer.innerHTML = ''; // Limpa a grade

    // Calcula os itens da página atual
    const inicio = (pagina - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const itensPaginados = agentesCulturais.slice(inicio, fim);

    // Renderiza os cards dos agentes da página atual
    itensPaginados.forEach(agente => {
        const cardHTML = `
            <div class="agente-card">
                <div class="agente-foto">
                    <img src="${agente.foto}" alt="Foto de ${agente.nome}">
                </div>
                <div class="agente-info">
                    <h3>${agente.nome}</h3>
                    <p>${agente.biografia}</p>
                </div>
            </div>
        `;
        gridContainer.innerHTML += cardHTML;
    });

    // Renderiza os botões da paginação
    setupPagination();
}

// 3. Função para criar e gerenciar os botões
function setupPagination() {
    const paginationContainer = document.querySelector('.pagination-container');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = ''; // Limpa os botões antigos
    const totalPaginas = Math.ceil(agentesCulturais.length / itensPorPagina);

    // Botão "Anterior"
    const btnAnterior = document.createElement('button');
    btnAnterior.innerText = 'Anterior';
    btnAnterior.classList.add('pagination-button');
    if (paginaAtual === 1) btnAnterior.classList.add('disabled');
    btnAnterior.addEventListener('click', () => {
        if (paginaAtual > 1) {
            displayPage(paginaAtual - 1);
        }
    });
    paginationContainer.appendChild(btnAnterior);

    // Botões de número de página
    for (let i = 1; i <= totalPaginas; i++) {
        const btnPagina = document.createElement('button');
        btnPagina.innerText = i;
        btnPagina.classList.add('pagination-button');
        if (i === paginaAtual) {
            btnPagina.classList.add('active');
        }
        btnPagina.addEventListener('click', () => {
            displayPage(i);
        });
        paginationContainer.appendChild(btnPagina);
    }

    // Botão "Próximo"
    const btnProximo = document.createElement('button');
    btnProximo.innerText = 'Próximo';
    btnProximo.classList.add('pagination-button');
    if (paginaAtual === totalPaginas) btnProximo.classList.add('disabled');
    btnProximo.addEventListener('click', () => {
        if (paginaAtual < totalPaginas) {
            displayPage(paginaAtual + 1);
        }
    });
    paginationContainer.appendChild(btnProximo);
}

// 4. Chamada inicial para mostrar a primeira página quando o site carrega
displayPage(1);
    
    // 1. INICIALIZAÇÃO DO MAPA
    const map = L.map('map').setView([-7.059800, -35.317108], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 2. DADOS DOS PONTOS CULTURAIS
    const culturalSpots = [
        {
            name: 'Casa da Cultura de Mari',
            lat: -7.059875,
            lng: -35.317466,
            category: 'museu',
            description: 'Espaço dedicado à cultura local e exposições artísticas.'
        },
    ];

    // Armazena os marcadores em um objeto para fácil acesso
    const markers = {};
    const markerLayer = L.layerGroup().addTo(map); // Camada para adicionar/remover marcadores

    // Função para criar e exibir os marcadores
    function displayMarkers(category) {
        // Limpa os marcadores existentes
        markerLayer.clearLayers();

        // Filtra os locais com base na categoria
        const filteredSpots = (category === 'todos')
            ? culturalSpots // Se for 'todos', usa a lista completa
            : culturalSpots.filter(spot => spot.category === category); // Senão, filtra

        // Adiciona os marcadores filtrados ao mapa
        filteredSpots.forEach(spot => {
            const marker = L.marker([spot.lat, spot.lng]);
            marker.bindPopup(`<b>${spot.name}</b><br>${spot.description}`);
            markerLayer.addLayer(marker);
        });
    }

    // Seleciona todos os botões de filtro
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Adiciona um "ouvinte" de clique a cada botão
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe 'active' de todos os botões
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Adiciona a classe 'active' ao botão clicado
            button.classList.add('active');

            // Pega a categoria do botão (do atributo 'data-category')
            const category = button.dataset.category;

            // Chama a função para exibir os marcadores da categoria selecionada
            displayMarkers(category);
        });
    });

    // Exibe todos os marcadores inicialmente ao carregar a página
    displayMarkers('todos');
});
// --- Lógica do Menu Hamburger ---

// Seleciona os elementos do DOM
const hamburgerButton = document.querySelector('.hamburger-button');
const mobileNav = document.querySelector('.mobile-nav');
const closeButton = document.querySelector('.close-button');

// Função para abrir o menu
function abrirMenu() {
    mobileNav.classList.add('mobile-nav-open');
}

// Função para fechar o menu
function fecharMenu() {
    mobileNav.classList.remove('mobile-nav-open');
}

// Adiciona eventos de clique aos botões
if (hamburgerButton && mobileNav && closeButton) {
    hamburgerButton.addEventListener('click', abrirMenu);
    closeButton.addEventListener('click', fecharMenu);

    // Opcional: Fecha o menu se clicar em um link dentro dele
    mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', fecharMenu);
    });
}