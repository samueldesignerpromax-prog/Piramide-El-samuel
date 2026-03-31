import fs from 'fs';
import path from 'path';

const coursesPath = path.join(process.cwd(), 'data', 'courses.json');

function readCourses() {
    const data = fs.readFileSync(coursesPath, 'utf-8');
    return JSON.parse(data);
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
        const courses = readCourses();
        return res.json(courses);
    }
    
    res.status(405).json({ error: 'Method not allowed' });
}
