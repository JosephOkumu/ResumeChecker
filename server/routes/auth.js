import express from 'express';
import { randomUUID } from 'crypto';
import { verifyGoogleToken, generateJWT, authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// Google OAuth login
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ error: 'Google token required' });
        }

        // Verify Google token
        const googleUser = await verifyGoogleToken(token);
        
        // Check if user exists
        const [existingUsers] = await pool.execute(
            'SELECT * FROM users WHERE google_id = ?',
            [googleUser.sub]
        );

        let user;
        
        if (existingUsers.length > 0) {
            // Update existing user
            user = existingUsers[0];
            await pool.execute(
                'UPDATE users SET name = ?, email = ?, picture = ?, updated_at = CURRENT_TIMESTAMP WHERE google_id = ?',
                [googleUser.name, googleUser.email, googleUser.picture, googleUser.sub]
            );
        } else {
            // Create new user
            const userId = randomUUID();
            await pool.execute(
                'INSERT INTO users (id, google_id, email, name, picture) VALUES (?, ?, ?, ?, ?)',
                [userId, googleUser.sub, googleUser.email, googleUser.name, googleUser.picture]
            );
            
            user = {
                id: userId,
                google_id: googleUser.sub,
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture
            };
        }

        // Generate JWT
        const jwtToken = generateJWT(user);

        res.json({
            token: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture
            }
        });

    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
    res.json({
        user: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            picture: req.user.picture
        }
    });
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

export default router;
