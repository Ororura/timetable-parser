import { readLessons, readGroups } from './api/read.js';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

type Command = {
	command: string;
	description: string;
};

dotenv.config();

const token = process.env.API_KEY;

const commands: Command[] = [
	{ command: '/start', description: 'Начало работы' },
	{ command: '/day', description: 'Выбрать день' },
];

if (!token) {
	throw new Error('Токен не найден');
}

const bot = new TelegramBot(token, { polling: true });

let selectedGroup: string | null = null;

bot.onText(/\/start/, async (msg) => {
	const chatId = msg.chat.id;

	await bot.sendMessage(chatId, 'Привет, я расскажу тебе пары на сегодня. Введи номер группы');

	bot.once('message', async (msg) => {
		const groupName = msg.text;

		if (!groupName) {
			await bot.sendMessage(chatId, 'Группа не найдена');
			return;
		}

		const data = await readGroups(
			'https://e-spo.ru/org/rasp/export/site/index?pid=1&RaspBaseSearch%5Bgroup_id%5D=&RaspBaseSearch%5Bsemestr%5D=osen&RaspBaseSearch%5Bprepod_id%5D=',
		);

		const group = data.get(groupName);

		if (!group) {
			await bot.sendMessage(chatId, 'Группа не найдена');
			return;
		}

		selectedGroup = group;

		await bot.sendMessage(chatId, `Выбрана группа ${groupName}`);

		await bot.sendMessage(
			chatId,
			'Теперь выбери день\n1. Понедельник\n2. Вторник\n3. Среда\n4. Четверг\n5. Пятница\n6. Суббота',
			{
				reply_markup: {
					keyboard: [
						[{ text: '/day 1' }],
						[{ text: '/day 2' }],
						[{ text: '/day 3' }],
						[{ text: '/day 4' }],
						[{ text: '/day 5' }],
						[{ text: '/day 6' }],
					],
				},
			},
		);
	});
});

bot.onText(/\/day (.+)/, async (msg, match) => {
	if (selectedGroup === null) {
		await bot.sendMessage(msg.chat.id, 'Выбери группу');
		return;
	}

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

	const response = await readLessons(
		`https://e-spo.ru/org/rasp/export/site/index?pid=1&RaspBaseSearch%5Bgroup_id%5D=${selectedGroup}&RaspBaseSearch%5Bsemestr%5D=osen&RaspBaseSearch%5Bprepod_id%5D=`,
	);

	if (response && response[number] && typeof response[number] === 'object' && 'lessons' in response[number]) {
		const lessons = response[number].lessons
			.map((lesson, index) => {
				if (!lesson.teacher) {
					return `#${index + 1} \n----------------------------------------`;
				}
				return `#${index + 1}\n${lesson.time}\nКабинет: ${lesson.room}\n${lesson.teacher}\n${lesson.discipline}`;
			})
			.join('\n\n');

		await bot.sendMessage(chatId, lessons);
	} else {
		await bot.sendMessage(chatId, 'Нет данных для выбранного дня');
	}
});

bot.setMyCommands(commands);
