import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const salesPath = path.join(process.cwd(), 'data', 'sales.json');
const usersPath = path.join(process.cwd(), 'data', 'users.json');

// Lista de 200+ nomes para PIX dinâmico
const pixNames = [
    'Maria Silva', 'João Santos', 'Ana Oliveira', 'Pedro Costa', 'Lucas Lima',
    'Juliana Ferreira', 'Rafael Rodrigues', 'Camila Alves', 'Bruno Nunes', 'Patrícia Gomes',
    'Thiago Martins', 'Letícia Araújo', 'Felipe Ribeiro', 'Carolina Dias', 'Diego Barbosa',
    'Amanda Carvalho', 'Leonardo Rocha', 'Natália Mendes', 'Gustavo Teixeira', 'Isabela Correia',
    'Henrique Moraes', 'Larissa Farias', 'Vinícius Cardoso', 'Bianca Campos', 'Eduardo Soares',
    'Mariana Lopes', 'Daniel Castro', 'Renata Freitas', 'Rodrigo Machado', 'Vanessa Moreira',
    'Carlos Eduardo', 'Fernanda Lima', 'Roberto Almeida', 'Tatiana Santos', 'Fábio Oliveira',
    'Priscila Costa', 'Marcelo Pereira', 'Luciana Rodrigues', 'André Fernandes', 'Simone Gomes',
    'José Augusto', 'Cristina Martins', 'Ricardo Araújo', 'Mônica Ribeiro', 'Fernando Dias',
    'Débora Barbosa', 'Alexandre Carvalho', 'Adriana Rocha', 'Sérgio Mendes', 'Daniela Teixeira',
    'Wagner Correia', 'Elaine Farias', 'Maurício Cardoso', 'Sabrina Campos', 'Rogério Soares',
    'Carla Lopes', 'Anderson Castro', 'Vanessa Freitas', 'Marcos Vinícius', 'Luciano Machado',
    'Gisele Moreira', 'Thales Lima', 'Viviane Oliveira', 'Cristiano Costa', 'Aline Pereira',
    'Jeferson Rodrigues', 'Karen Fernandes', 'Alex Gomes', 'Simone Martins', 'Jonathan Araújo',
    'Michelle Ribeiro', 'Wesley Dias', 'Nathália Barbosa', 'Erick Carvalho', 'Letícia Rocha',
    'Igor Mendes', 'Tatiane Teixeira', 'Caio Correia', 'Juliana Farias', 'Victor Cardoso',
    'Bárbara Campos', 'Matheus Soares', 'Stefany Lopes', 'Otávio Castro', 'Manuela Freitas',
    'Enzo Machado', 'Valentina Moreira', 'Bernardo Lima', 'Helena Oliveira', 'Arthur Costa',
    'Alice Pereira', 'Davi Rodrigues', 'Laura Fernandes', 'Gabriel Gomes', 'Manuela Martins',
    'Samuel Araújo', 'Sophia Ribeiro', 'Lucas Dias', 'Isabella Barbosa', 'Benjamin Carvalho',
    'Clara Rocha', 'Henry Mendes', 'Melissa Teixeira', 'Pietro Correia', 'Eduarda Farias'
];

function readSales() {
    const data = fs.readFileSync(salesPath, 'utf-8');
    return JSON.parse(data);
}

function writeSales(sales) {
    fs.writeFileSync(salesPath, JSON.stringify(sales, null, 2));
}

function readUsers() {
    const data = fs.readFileSync(usersPath, 'utf-8');
    return JSON.parse(data);
}

function writeUsers(users) {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
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

    if (req.method === 'POST') {
        const { courseId, courseName, amount, buyerName, affiliateCode } = req.body;
        
        // Gerar PIX aleatório
        const randomName = pixNames[Math.floor(Math.random() * pixNames.length)];
        const pixKey = crypto.randomBytes(16).toString('hex');
        const pixQRCode = `00020126360014br.gov.bcb.pix0114${pixKey}5204000053039865404${amount}5802BR5913${randomName}6009SAO PAULO62070503***6304`;
        
        // Criar venda
        const newSale = {
            id: Date.now().toString(),
            courseId,
            courseName,
            amount,
            buyerName,
            affiliateCode: affiliateCode || null,
            pixKey,
            pixName: randomName,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        const sales = readSales();
        sales.push(newSale);
        writeSales(sales);
        
        // Se tiver código de afiliado, adicionar comissão
        if (affiliateCode) {
            const users = readUsers();
            const affiliate = users.find(u => u.id === affiliateCode);
            if (affiliate) {
                const commission = amount * 0.3; // 30% de comissão
                affiliate.commission = (affiliate.commission || 0) + commission;
                writeUsers(users);
                
                newSale.commission = commission;
                newSale.affiliateName = affiliate.name;
            }
        }
        
        return res.json({
            success: true,
            pix: {
                qrCode: pixQRCode,
                pixKey: pixKey,
                name: randomName,
                amount: amount,
                expiresIn: 3600
            },
            saleId: newSale.id
        });
    }
    
    if (req.method === 'GET') {
        const sales = readSales();
        const recentSales = sales.slice(-20).reverse();
        
        return res.json({
            success: true,
            recentSales: recentSales.map(sale => ({
                buyerName: sale.buyerName,
                courseName: sale.courseName,
                amount: sale.amount,
                pixName: sale.pixName,
                createdAt: sale.createdAt
            }))
        });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
}
