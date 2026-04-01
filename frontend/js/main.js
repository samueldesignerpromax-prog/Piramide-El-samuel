const API_BASE = window.location.origin;
let currentUser = null;
let commentsInterval;
let pixNamesInterval;

// Cursos disponíveis
const courses = [
    {
        id: 1,
        name: "Tecnologia Avançada",
        category: "tecnologia",
        description: "Domine as últimas tecnologias do mercado",
        price: 297,
        oldPrice: 597,
        image: "https://via.placeholder.com/300x200/667eea/ffffff?text=Tecnologia",
        badge: "Mais Vendido"
    },
    {
        id: 2,
        name: "Estudos Sociais Modernos",
        category: "sociais",
        description: "Entenda as dinâmicas sociais atuais",
        price: 197,
        oldPrice: 397,
        image: "https://via.placeholder.com/300x200/764ba2/ffffff?text=Sociais",
        badge: "Recomendado"
    },
    {
        id: 3,
        name: "Culinária Profissional",
        category: "culinaria",
        description: "Técnicas avançadas de gastronomia",
        price: 247,
        oldPrice: 497,
        image: "https://via.placeholder.com/300x200/f093fb/ffffff?text=Culinaria",
        badge: "Prático"
    },
    {
        id: 4,
        name: "GANHE DINHEIRO COM INTERNET",
        category: "especial",
        description: "Método completo para faturar online - Sistema de Afiliados incluso!",
        price: 497,
        oldPrice: 997,
        image: "https://via.placeholder.com/300x200/f5576c/ffffff?text=GANHE+DINHEIRO",
        badge: "HOT! + Bônus"
    }
];

// Carregar cursos
async function loadCourses() {
    const container = document.getElementById('coursesContainer');
    container.innerHTML = courses.map(course => `
        <div class="col-md-6 col-lg-3">
            <div class="course-card" onclick="buyCourse(${course.id})">
                <div class="course-img" style="background-image: url('${course.image}')">
                    <div class="course-badge">${course.badge}</div>
                </div>
                <div class="p-3">
                    <h5>${course.name}</h5>
                    <p class="text-muted small">${course.description}</p>
                    <div class="price">
                        R$ ${course.price.toFixed(2)}
                        <span class="old-price">R$ ${course.oldPrice.toFixed(2)}</span>
                    </div>
                    <button class="btn btn-gradient w-100 mt-3" onclick="event.stopPropagation(); buyCourse(${course.id})">
                        <i class="fas fa-shopping-cart"></i> Comprar Agora
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Comprar curso
async function buyCourse(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    const { value: buyerName } = await Swal.fire({
        title: 'Seu nome para o certificado',
        input: 'text',
        inputPlaceholder: 'Digite seu nome completo',
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar'
    });
    
    if (!buyerName) return;
    
    Swal.fire({
        title: 'Processando pagamento...',
        html: 'Aguarde, gerando PIX',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        const response = await axios.post(`${API_BASE}/api/pix`, {
            courseId: course.id,
            courseName: course.name,
            amount: course.price,
            buyerName: buyerName,
            affiliateCode: currentUser?.id
        });
        
        if (response.data.success) {
            Swal.close();
            showPixModal(response.data.pix, response.data.saleId);
        }
    } catch (error) {
        Swal.fire('Erro', 'Erro ao gerar pagamento', 'error');
    }
}

// Mostrar modal PIX
function showPixModal(pixData, saleId) {
    const modalContent = document.getElementById('pixContent');
    modalContent.innerHTML = `
        <div class="alert alert-success">
            <i class="fas fa-check-circle"></i> PIX gerado com sucesso!
        </div>
        <div class="mb-3">
            <strong>Beneficiário:</strong> ${pixData.name}
        </div>
        <div class="mb-3">
            <strong>Valor:</strong> R$ ${pixData.amount.toFixed(2)}
        </div>
        <div class="mb-3">
            <strong>Código PIX (copia e cola):</strong>
            <textarea class="form-control" rows="3" readonly>${pixData.qrCode}</textarea>
        </div>
        <div class="alert alert-info">
            <i class="fas fa-clock"></i> Após o pagamento, o acesso será liberado em até 5 minutos
        </div>
        <button class="btn btn-success" onclick="simulatePayment('${saleId}')">
            <i class="fas fa-check"></i> Simular Pagamento (Demo)
        </button>
    `;
    
    new bootstrap.Modal(document.getElementById('pixModal')).show();
}

// Simular pagamento
async function simulatePayment(saleId) {
    Swal.fire('Pagamento Simulado!', 'Em produção real, o PIX seria confirmado automaticamente.', 'success');
    setTimeout(() => {
        Swal.fire('Acesso Liberado!', 'Você já pode acessar o curso na sua área de membros.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('pixModal')).hide();
    }, 1500);
}

// Carregar comentários dinâmicos
async function loadComments() {
    try {
        const response = await axios.get(`${API_BASE}/api/comments`);
        if (response.data.success) {
            const container = document.getElementById('liveComments');
            container.innerHTML = response.data.comments.map(comment => `
                <div class="comment-item">
                    <strong><i class="fas fa-user-circle"></i> ${comment.name}</strong>
                    <div class="text-warning">${'★'.repeat(comment.rating)}${'☆'.repeat(5-comment.rating)}</div>
                    <p>${comment.comment}</p>
                    <small class="text-muted">Curso: ${comment.course} • ${new Date(comment.timestamp).toLocaleTimeString()}</small>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
    }
}

// Login
async function login(email, password) {
    try {
        const response = await axios.post(`${API_BASE}/api/auth`, {
            action: 'login',
            email,
            password
        });
        
        if (response.data.success) {
            currentUser = response.data.user;
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateUserMenu();
            Swal.fire('Sucesso!', 'Login realizado com sucesso!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            loadDashboard();
        }
    } catch (error) {
        Swal.fire('Erro', error.response?.data?.error || 'Erro no login', 'error');
    }
}

// Cadastro
async function register(name, email, password, referrerCode) {
    try {
        const response = await axios.post(`${API_BASE}/api/auth`, {
            action: 'register',
            name,
            email,
            password,
            referrerCode
        });
        
        if (response.data.success) {
            currentUser = response.data.user;
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateUserMenu();
            Swal.fire('Sucesso!', 'Cadastro realizado com sucesso!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
            loadDashboard();
        }
    } catch (error) {
        Swal.fire('Erro', error.response?.data?.error || 'Erro no cadastro', 'error');
    }
}

// Carregar dashboard do afiliado
async function loadDashboard() {
    if (!currentUser) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/api/affiliate`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
            const user = response.data.user;
            document.getElementById('dashboardSection').innerHTML = `
                <div class="dashboard-card">
                    <h3>Bem-vindo, ${user.name}!</h3>
                    <div class="row mt-3">
                        <div class="col-md-3">
                            <div class="alert alert-info">
                                <h5>Nível: <span class="affiliate-level">${user.level.toUpperCase()}</span></h5>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="alert alert-success">
                                <h5>Vendas: ${user.totalSales}</h5>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="alert alert-warning">
                                <h5>Comissão: R$ ${user.totalCommission.toFixed(2)}</h5>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="alert alert-secondary">
                                <h5>Meta: ${user.nextLevelGoal}</h5>
                            </div>
                        </div>
                    </div>
                    
                    <div class="commission-tree mt-4">
                        <h5><i class="fas fa-tree"></i> Sua Rede (Downline)</h5>
                        ${user.downline.length > 0 ? user.downline.map(d => `
                            <div class="hierarchy-node">
                                <strong>${d.name}</strong> - ${d.sales} vendas | R$ ${d.commission.toFixed(2)}
                            </div>
                        `).join('') : '<p>Você ainda não tem indicados. Compartilhe seu link!</p>'}
                    </div>
                    
                    <div class="mt-3">
                        <h5>Seu Link de Afiliado:</h5>
                        <div class="input-group">
                            <input type="text" class="form-control" value="${window.location.origin}?ref=${user.id}" readonly>
                            <button class="btn btn-primary" onclick="copyLink()">Copiar</button>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('dashboardSection').style.display = 'block';
            document.getElementById('coursesSection').style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function copyLink() {
    const input = document.querySelector('#dashboardSection input');
    input.select();
    document.execCommand('copy');
    Swal.fire('Link copiado!', 'Compartilhe com seus amigos e ganhe comissões!', 'success');
}

function updateUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (currentUser) {
        userMenu.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                    <i class="fas fa-user"></i> ${currentUser.name}
                </button>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#" onclick="showDashboard()">Dashboard</a></li>
                    <li><a class="dropdown-item" href="#" onclick="showCourses()">Cursos</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="logout()">Sair</a></li>
                </ul>
            </div>
        `;
    } else {
        userMenu.innerHTML = `<button class="btn btn-outline-primary" onclick="showLogin()"><i class="fas fa-user"></i> Login</button>`;
    }
}

function showLogin() {
    new bootstrap.Modal(document.getElementById('loginModal')).show();
}

function showRegister() {
    bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
    new bootstrap.Modal(document.getElementById('registerModal')).show();
}

function showDashboard() {
    if (currentUser) {
        document.getElementById('dashboardSection').style.display = 'block';
        document.getElementById('coursesSection').style.display = 'none';
        loadDashboard();
    }
}

function showCourses() {
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('coursesSection').style.display = 'block';
}

function logout() {
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateUserMenu();
    showCourses();
    Swal.fire('Logout', 'Você saiu do sistema', 'success');
}

// Event Listeners
document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    login(email, password);
});

document.getElementById('registerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const referrer = document.getElementById('regReferrer').value;
    register(name, email, password, referrer);
});

// Verificar usuário logado ao carregar
const savedUser = localStorage.getItem('user');
if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateUserMenu();
}

// Iniciar carregamento
loadCourses();
loadComments();
setInterval(loadComments, 10000); // Atualizar comentários a cada 10 segundos

// Contador de usuários ativos
let activeCount = 50;
setInterval(() => {
    activeCount = Math.floor(Math.random() * 100) + 50;
    document.getElementById('activeUsers').innerHTML = `+${activeCount} pessoas comprando agora`;
}, 5000);
