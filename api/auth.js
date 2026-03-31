import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const usersPath = path.join(process.cwd(), 'data', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'edusystem_secret_key_2024';

// Helper para ler usuários
function readUsers() {
    const data = fs.readFileSync(usersPath, 'utf-8');
    return JSON.parse(data);
}

// Helper para escrever usuários
function writeUsers(users) {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        const { action, email, password, name, referrerCode } = req.body;

        // LOGIN
        if (action === 'login') {
            const users = readUsers();
            const user = users.find(u => u.email === email);
            
            if (!user) {
                return res.status(401).json({ error: 'Usuário não encontrado' });
            }
            
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Senha incorreta' });
            }
            
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role, level: user.level },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            return res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    level: user.level,
                    totalSales: user.totalSales || 0,
                    commission: user.commission || 0,
                    referrals: user.referrals || []
                }
            });
        }
        
        // REGISTER
        else if (action === 'register') {
            const users = readUsers();
            
            if (users.find(u => u.email === email)) {
                return res.status(400).json({ error: 'Email já cadastrado' });
            }
            
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = {
                id: Date.now().toString(),
                name,
                email,
                password: hashedPassword,
                role: 'seller', // seller ou affiliate
                level: 'seller', // seller, affiliate, master
                totalSales: 0,
                commission: 0,
                referrals: [],
                referrerCode: referrerCode || null,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            writeUsers(users);
            
            // Se tiver código de referência, adicionar ao referenciador
            if (referrerCode) {
                const referrer = users.find(u => u.id === referrerCode);
                if (referrer) {
                    referrer.referrals.push(newUser.id);
                    writeUsers(users);
                }
            }
            
            const token = jwt.sign(
                { id: newUser.id, email: newUser.email, role: newUser.role, level: newUser.level },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            return res.json({
                success: true,
                token,
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    level: newUser.level,
                    totalSales: 0,
                    commission: 0,
                    referrals: []
                }
            });
        }
    }
    
    res.status(405).json({ error: 'Method not allowed' });
}
