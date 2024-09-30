FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3300

# Устанавливаем команду по умолчанию для запуска приложения
CMD ["npm", "run", "dev"]
