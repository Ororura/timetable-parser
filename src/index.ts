import { read, readGroups } from './api/read.js';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.API_KEY;

if (!token) {
	throw new Error('Токен не найден');
}

const bot = new TelegramBot(token, { polling: true });

let selectedGroup: string | undefined = '';

bot.onText(/\/start/, async (msg) => {
	const chatId = msg.chat.id;

	await bot.sendMessage(chatId, 'Привет, я расскажу тебе пары на сегодня. Введи номер группы');

	bot.once('message', async (msg) => {
		const groupId = msg.text;

		const data = await readGroups(
			'https://e-spo.ru/org/rasp/export/site/index?pid=1&RaspBaseSearch%5Bgroup_id%5D=&RaspBaseSearch%5Bsemestr%5D=osen&RaspBaseSearch%5Bprepod_id%5D=',
		);

		if (!groupId) {
			await bot.sendMessage(chatId, 'Группа не найдена');
			return;
		}

		selectedGroup = data.get(groupId);

		if (!selectedGroup) {
			await bot.sendMessage(chatId, 'Группа не найдена');
			return;
		}

		await bot.sendMessage(chatId, `Выбрана группа ${groupId}`);

		await bot.sendMessage(
			chatId,
			'Теперь выбери день\n1. Понедельник\n2. Вторник\n3. Среда\n4. Четверг\n5. Пятница\n6. Суббота\n7. Воскресенье',
			{
				reply_markup: {
					keyboard: [
						[{ text: '/день 1' }],
						[{ text: '/день 2' }],
						[{ text: '/день 3' }],
						[{ text: '/день 4' }],
						[{ text: '/день 5' }],
						[{ text: '/день 6' }],
						[{ text: '/день 7' }],
					],
				},
			},
		);
	});
});

bot.onText(/\/день (.+)/, async (msg, match) => {
	if (!match) {
		await bot.sendMessage(msg.chat.id, 'Введи корректный номер дня (от 1 до 7)');
		return;
	}

	const chatId = msg.chat.id;
	const number = parseInt(match[1]);

	if (isNaN(number) || number < 1 || number > 7) {
		await bot.sendMessage(chatId, 'Введи корректный номер дня (от 1 до 7)');
		return;
	}

	const response = await read(
		`https://e-spo.ru/org/rasp/export/site/index?pid=1&RaspBaseSearch%5Bgroup_id%5D=${selectedGroup}&RaspBaseSearch%5Bsemestr%5D=osen&RaspBaseSearch%5Bprepod_id%5D=`,
	);

	if (response && response[number] && typeof response[number] === 'object' && 'lessons' in response[number]) {
		const lessons = response[number].lessons
			.map((lesson, index) => `#${index + 1}\n${lesson.time}\n${lesson.teacher}\n${lesson.discipline}`)
			.join('\n\n');

		await bot.sendMessage(chatId, lessons);
	} else {
		await bot.sendMessage(chatId, 'Нет данных для выбранного дня');
	}
});
