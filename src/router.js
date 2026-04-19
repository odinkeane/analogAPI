import { Router } from "express"
import { Actors, Films, Token, User, Favorite } from "./DatabaseManager.js"
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import yaml from 'yaml';
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from "../config.js";
import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"


const router = Router()
const __dirname = import.meta.dirname
const swaggerDocument = yaml.parse(readFileSync('./swagger.yaml', 'utf8'));
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// Константы
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';


// Генерация access токена
const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_ACCESS_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
};

const generateRefreshToken = async (userId) => {
    // Удаляем старые refresh токены пользователя
    Token.deleteTokenByUserId(userId)
    // Создаем токен
    const refreshToken = jwt.sign(
        { userId },
        JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
    // Вычисляем дату истечения (7 дней)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    // Сохраняем в БД
    Token.saveToken(userId, refreshToken, expiresAt)
    return refreshToken;
};


const validateRegister = [
    body('email').isEmail().withMessage('Введите корректный email'),
    body('password').isLength({ min: 6 }).withMessage('Пароль должен быть минимум 6 символов'),
    body('username').notEmpty().withMessage('Имя обязательно'),
];


router.post('/register', validateRegister, async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const { email, password, username } = req.body
    try {
        // Проверяем, существует ли пользователь
        const existingUser = await User.getUserByEmail(email)[0]
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь с таким email уже существует' })
        }

        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10)

        // Создаём пользователя
        const data = await User.create(email, hashedPassword, username)

        const user = (await User.getUserByEmail(email))[0];
        delete user.password

        // Генерируем токены
        const accessToken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user.id)
        return res.status(201).json({
            message: 'Регистрация успешна',
            accessToken,
            refreshToken,
            user
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера при регистрации' });
    }
})


const validateLogin = [
    body('email').isEmail().withMessage('Введите корректный email'),
    body('password').notEmpty().withMessage('Пароль обязателен'),
];


router.post("/login", validateLogin, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        // Ищем пользователя
        const user = (await User.getUserByEmail(email))[0]
        if (!user) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }
        // Проверяем пароль
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }
        // Убираем пароль из объекта пользователя
        const { password: _, ...userWithoutPassword } = user;
        // Генерируем токены
        const accessToken = generateAccessToken(userWithoutPassword);
        const refreshToken = await generateRefreshToken(user.id);
        res.json({
            message: 'Вход выполнен успешно',
            accessToken,
            refreshToken,
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера при входе' });
    }
})

router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token не предоставлен' });
    }

    try {
        // Проверяем, существует ли токен в БД и не истёк ли он
        const storedToken = Token.getToken(refreshToken)
        if (!storedToken) {
            return res.status(403).json({ message: 'Недействительный refresh token' });
        }
        // Проверяем срок действия
        const now = new Date();
        const expiresAt = new Date(storedToken.expires_at);
        if (expiresAt < now) {
            Token.deleteToken(refreshToken)
            return res.status(403).json({ message: 'Refresh token истёк' });
        }
        // Верифицируем JWT
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

        // Проверяем соответствие user_id
        if (decoded.userId !== storedToken.user_id) {
            return res.status(403).json({ message: 'Недействительный refresh token' });
        }

        // Получаем пользователя
        const user = await User.getUserByEmail(storedToken.email)
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        // Генерируем новый access token
        const newAccessToken = generateAccessToken(user);
        res.json({
            accessToken: newAccessToken,
        });

    } catch (error) {
        console.error(error);
        if (error instanceof jwt.TokenExpiredError) {
            // Удаляем истёкший токен из БД
            Token.deleteToken(refreshToken)
            return res.status(403).json({ message: 'Refresh token истёк' });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(403).json({ message: 'Недействительный refresh token' });
        }
        res.status(500).json({ message: 'Ошибка при обновлении токена' });
    }
})

router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        // Удаляем refresh токен из БД
        Token.deleteToken(refreshToken)
    }
    res.json({ message: 'Выход выполнен успешно' });
});



const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Доступ запрещён. Токен не предоставлен' });
    }
    jwt.verify(token, JWT_ACCESS_SECRET, (err, user) => {
        if (err) {
            if (err instanceof jwt.TokenExpiredError) {
                return res.status(401).json({ message: 'Токен истёк', code: 'TOKEN_EXPIRED' });
            }
            return res.status(403).json({ message: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
};



router.get("/favorites", authenticateToken, async (req, res) => {
    const id = req.user.id
    const films = await Favorite.getFavoritesById(id)
    res.status(200).json(films)
})

router.post("/favorites", authenticateToken, (req, res) => {
    const { film_id } = req.body
    Favorite.saveFavoriteFilm(req.user.id, film_id)
    res.status(201).json({ message: "Фильм добавлен" })
})

router.delete("/favorites", authenticateToken, (req, res) => {
    const { film_id } = req.body
    Favorite.deleteFavoriteFilm(req.user.id, film_id)
    res.status(204).json({ message: "Фильм добавлен" })
})







router.get("/films", async (req, res) => {
    const films = await Films.getAllFilms()
    return res.status(200).json(films)
})

router.get("/top25", async (req, res) => {
    const films = await Films.getTop25()
    return res.status(200).json(films)
})


router.get("/films/:id", async (req, res) => {
    const film_id = req.params["id"]
    const film = await Films.getFilmById(film_id)
    const genres = await Films.getGenresForFilm(film_id)
    const actors = await Actors.getActorsByFilm(film_id)
    film[0].genres = genres
    film[0].actors = actors
    res.status(200).json(film[0])
})


router.get("/actors", async (req, res) => {
    const actors = await Actors.getAllActors()
    return res.status(200).json(actors)
})

router.get("/actors/:id", async (req, res) => {
    const actor_id = req.params["id"]
    const actor = await Actors.getActorById(actor_id)
    const films = await Films.getFilmByActor(actor_id)
    actor[0].films = films
    return res.status(200).json(actor[0])
})




export default router