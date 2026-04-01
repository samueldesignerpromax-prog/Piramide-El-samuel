import fs from 'fs';
import path from 'path';

const commentsPath = path.join(process.cwd(), 'data', 'comments.json');

function readComments() {
    const data = fs.readFileSync(commentsPath, 'utf-8');
    return JSON.parse(data);
}

// 50+ comentários positivos
const positiveComments = [
    "Curso incrível! Aprendi muito e já estou aplicando no meu negócio!",
    "Material muito completo, professores excelentes!",
    "Melhor curso que já fiz, recomendo demais!",
    "Conteúdo atualizado e prático. Vale cada centavo!",
    "Atendimento top, suporte rápido e eficiente.",
    "Já recuperei meu investimento em menos de uma semana!",
    "Plataforma fácil de usar, conteúdo de qualidade.",
    "Metodologia inovadora, aprendizado rápido e eficaz.",
    "Os exercícios práticos são excelentes para fixação.",
    "Certificado reconhecido, abriu muitas portas pra mim.",
    "Ganhei muito dinheiro com o curso especial de internet!",
    "A hierarquia de afiliados funciona muito bem, já estou faturando!",
    "PIX na hora, recebi o acesso imediatamente.",
    "Suporte 24h, tirei todas minhas dúvidas.",
    "Material atualizado constantemente, sempre novidades.",
    "Comunidade ativa, networking incrível.",
    "Os cases reais apresentados são muito inspiradores.",
    "Já indiquei para 5 amigos e todos aprovaram!",
    "A plataforma é muito intuitiva, nem precisei de ajuda.",
    "Resultados rápidos, em 15 dias já vi diferença.",
    "Melhor investimento que fiz esse ano!",
    "Curso completo, do básico ao avançado.",
    "Professores são referência no mercado.",
    "Aprendi a vender online mesmo sem experiência.",
    "O sistema de metas me motivou a vender mais!",
    "Comissões sempre pagas em dia, confiável.",
    "Material em vídeo de altíssima qualidade.",
    "Os bônus exclusivos são fantásticos!",
    "Suporte humano, não robô, isso fez diferença.",
    "Já sou afiliado master graças ao treinamento!",
    "Melhor decisão profissional que tomei.",
    "Conteúdo vale ouro, aprendizado garantido.",
    "A didática dos professores é sensacional.",
    "Prático, objetivo e direto ao ponto.",
    "Os cases de sucesso me inspiraram muito.",
    "Ferramentas exclusivas que não acho em outro lugar.",
    "Mentoria individualizada, me senti especial.",
    "Ganhei liberdade financeira com esse curso!",
    "Acesso vitalício, posso rever quando quiser.",
    "Atualizações constantes, sempre aprendendo algo novo.",
    "Melhor custo-benefício do mercado.",
    "Já fiz vários cursos, esse é o melhor!",
    "A comunidade de alunos é muito unida.",
    "Os desafios semanais me mantêm motivado.",
    "Parcerias incríveis com empresas grandes.",
    "Networking com os melhores profissionais.",
    "Plataforma moderna e responsiva.",
    "Recebi meu certificado rapidamente.",
    "O suporte pós-venda é excelente.",
    "Recomendo para todos que querem crescer!"
];

function getRandomComment() {
    return positiveComments[Math.floor(Math.random() * positiveComments.length)];
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        let comments = readComments();
        
        // Adicionar comentários aleatórios periodicamente
        const newComment = {
            id: Date.now().toString(),
            name: ["Carlos", "Ana", "Pedro", "Mariana", "Lucas", "Juliana", "Fernando", "Patrícia"][Math.floor(Math.random() * 8)],
            comment: getRandomComment(),
            rating: Math.floor(Math.random() * 2) + 4, // 4 ou 5 estrelas
            course: ["Tecnologia", "Estudos Sociais", "Culinária", "Ganhe Dinheiro com Internet"][Math.floor(Math.random() * 4)],
            timestamp: new Date().toISOString()
        };
        
        comments.unshift(newComment);
        if (comments.length > 100) comments = comments.slice(0, 100);
        fs.writeFileSync(commentsPath, JSON.stringify(comments, null, 2));
        
        return res.json({
            success: true,
            comments: comments.slice(0, 20)
        });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
}
