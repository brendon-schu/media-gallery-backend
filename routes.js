const express = require('express');
const pool = require('./db');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const upload = multer({ storage: multer.memoryStorage() });

require('dotenv').config();
const localStorageAdminToken = process.env.ADMIN_AUTH_TOKEN || 'someHardcodedFallbackToken';

const crypto = require('crypto');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'password123';

// Simple token generator (not real JWT, just basic for demo)
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Simple auth middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];  // Expect "Bearer <token>"

    if (token && token === localStorageAdminToken) {  // Replace with your stored token
        next();  // Proceed if token matches
    } else {
        res.status(403).json({ error: 'Unauthorized' });
    }
};

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        res.json({ token: process.env.ADMIN_AUTH_TOKEN });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

router.get('/artworks', async (req, res) => {
    const { categories, tags } = req.query;

    let query = 'SELECT * FROM artworks';
    const conditions = [];
    const values = [];

    if (categories) {
        const categoryList = categories.split(',');
        const categoryConditions = categoryList.map((cat, index) => {
            values.push(cat);
            return `$${values.length}`;
        }).join(', ');
        conditions.push(`category IN (${categoryConditions})`);
    }

    if (tags) {
        const tagList = tags.split(',');
        tagList.forEach(tag => {
            values.push(`%${tag}%`);
            conditions.push(`tags::text ILIKE $${values.length}`);
        });
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    try {
        const { rows } = await pool.query(query, values);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching artworks:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/artworks', authMiddleware, upload.single('image'), async (req, res) => {

    const { title, description, creator, date, tags, category } = req.body;
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
	const baseName = req.file.originalname.replace(/\s+/g, '-').replace(/\.[^/.]+$/, '');  // Remove original extension
	const filename = `${Date.now()}-${baseName}.jpg`;
    //const filename = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}.jpg`;
    const filePath = path.join(uploadDir, filename);

    const processedImage = await sharp(req.file.buffer)
        .resize({ width: 2000, height: 2000, fit: 'inside' })
        .jpeg({ quality: 90 })
        .toBuffer();

    fs.writeFileSync(filePath, processedImage);

    const thumbBuffer = await sharp(processedImage)
        .resize({ width: 300, height: 300, fit: 'inside' })
        .toBuffer();
    fs.writeFileSync(path.join(uploadDir, `thumb-${filename}`), thumbBuffer);

    const { rows } = await pool.query(
        'INSERT INTO artworks (title, description, creator, date, image_path, tags, category) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [title, description, creator, date, `/uploads/${filename}`, tagsArray, category]
    );

    res.json(rows[0]);
});

router.get('/artworks/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await pool.query('SELECT * FROM artworks WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Artwork not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching artwork:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/artworks/:id', authMiddleware, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { title, description, creator, tags, category } = req.body;

    try {
        const { rows } = await pool.query('SELECT * FROM artworks WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Artwork not found' });
        }
        const existingArtwork = rows[0];

        let imagePath = existingArtwork.image_path;

        if (req.file) {

			const baseName = req.file.originalname.replace(/\s+/g, '-').replace(/\.[^/.]+$/, '');  // Remove original extension
			const newFilename = `uploads/${Date.now()}-${baseName}.jpg`;
            //const newFilename = `uploads/${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}.jpg`;

            await sharp(req.file.buffer)
                .resize({ width: 2000, height: 2000, fit: 'inside' })
                .jpeg({ quality: 80 })
                .toFile(newFilename);

            imagePath = `/${newFilename}`;
        }

        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

        await pool.query(
            `UPDATE artworks SET
                title = $1,
                description = $2,
                creator = $3,
                image_path = $4,
                tags = $5,
                category = $6
            WHERE id = $7`,
            [title, description, creator, imagePath, tagsArray, category, id]
        );

        res.json({ message: 'Artwork updated' });
    } catch (err) {
        console.error('Error updating artwork:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/categories', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT DISTINCT category FROM artworks');
        res.json(rows.map(row => row.category).filter(Boolean));
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/tags', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT tags FROM artworks');
        const allTags = rows.flatMap(row => row.tags).filter(Boolean);
        const uniqueTags = [...new Set(allTags)];
        res.json(uniqueTags);
    } catch (err) {
        console.error('Error fetching tags:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;

