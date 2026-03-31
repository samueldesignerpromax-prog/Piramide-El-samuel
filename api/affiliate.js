import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const usersPath = path.join(process.cwd(), 'data', 'users.json');
const salesPath = path.join(process.cwd(), 'data', 'sales.json');
const JWT_SECRET = process.env.JWT_SECRET || 'edusystem_secret_key_2024';

function readUsers() {
    const data = fs.readFileSync(usersPath, 'utf-8');
    return JSON.parse(data);
}

function readSales() {
    const data = fs.readFileSync(salesPath, 'utf-8');
    return JSON.parse(data);
}

function writeSales(sales) {
    fs.writeFileSync(salesPath, JSON.stringify(sales, null, 2));
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
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

    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    if (req.method === 'GET') {
        const users = readUsers();
        const sales = readSales();
        const user = users.find(u => u.id === decoded.id);
        
        // Calcular comissões e hierarquia
        const userSales = sales.filter(s => s.sellerId === user.id);
        const totalSalesAmount = userSales.reduce((sum, sale) => sum + sale.amount, 0);
        
        // Verificar se atingiu meta para virar afiliado (meta: 5 vendas ou R$1000)
        if (user.role === 'seller' && (userSales.length >= 5 || totalSalesAmount >= 1000)) {
            user.role = 'affiliate';
            user.level = 'affiliate';
            user.promotedAt = new Date().toISOString();
            fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        }
        
        // Buscar downline (vendedores indicados)
        const downline = users.filter(u => u.referrerCode === user.id);
        
        return res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                level: user.level,
                totalSales: userSales.length,
                totalCommission: user.commission || 0,
                sales: userSales,
                downline: downline.map(d => ({
                    id: d.id,
                    name: d.name,
                    sales: sales.filter(s => s.sellerId === d.id).length,
                    commission: d.commission || 0
                })),
                nextLevelGoal: user.role === 'seller' ? '5 vendas ou R$1000 para virar afiliado' : '10 vendas para virar master'
            }
        });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
}
