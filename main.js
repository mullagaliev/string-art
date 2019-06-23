const express = require('express');
const app = express();
const cors = require('cors');
const request = require('request');

const StringArt  = require('./StringArt');
const sizeOf = require('image-size');
const fs = require('fs');
const https = require("https");

const Telegraf = require('telegraf');
const Telegram = require('telegraf/telegram');

const inpSrc = './inp/2.jpg';
const image = fs.readFileSync(inpSrc);
const size = sizeOf(inpSrc);


function startExpress() {
  const PORT = 3000;
  app.use(cors());

  app.use('/out', express.static('out'));

  app.get('/random', function (req, res) {
    const start = new Date().getTime();
    StringArt.generateTriangulation(image, size, 'jpg', ({fileLink}) => {
      // res.redirect(fileLink);
      res.sendfile(fileLink);
      // res.send(fileLink);
    });
    const end = new Date().getTime();
    console.log(`Time: ${end - start}ms, size: w-${size.width} h-${size.height}`);
  });

  app.listen(PORT, () => console.log(`Express GraphQL Server Now Running On localhost:${PORT}`));
}

function startBot() {
  const bot = new Telegraf(process.env.BOT_TOKEN);
  const telegram = new Telegram(process.env.BOT_TOKEN);
  async function onPhotos(ctx) {
    try {
      const files = ctx.update.message.photo;
      const fileId = files[files.length - 1].file_id;
      const chatId = ctx.update.message.chat.id;
      const file = await telegram.getFile(fileId);
      var patt1 = /\.([0-9a-z]+)(?:[\?#]|$)/i;

      const fileLink = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
      const type = (fileLink).match(patt1)[1];
      console.log('type', type);
      const filePath = `./inp/${fileId}.${type}`;

      console.log(filePath, fileLink);
      await new Promise((resolve, reject) => {
        https.get(fileLink, response => {
          if(response.statusCode !== 200){
            reject('error not found');
          }
          const inpFile = fs.createWriteStream(filePath);
          const stream = response.pipe(inpFile);
          stream.on('finish', () => resolve());
        });
      });
      console.log(filePath, fileLink);
      ctx.reply('👍 Файл сохранен');
      ctx.reply('🔄 Пожалуйста, подождите. Начинаем обработку... ');
      const image = fs.readFileSync(filePath);
      const size = sizeOf(filePath);
      const start = new Date().getTime();

      StringArt.generateTriangulation(image, size, type, async ({fileLink, file}) => {
        console.log('complete', fileLink);
        const end = new Date().getTime();
        console.log(`Time: ${Math.floor(end - start)} сек., size: w-${size.width} h-${size.height}`);
        ctx.reply('✅ Обработка файла завершена. Начинаем отправку...');
        ctx.reply(`⏱️ Время обработки: ${end - start}ms.`);
        return telegram.sendPhoto(chatId, {
          source: file
        });
      });
      StringArt.generateLinesAlog(filePath);
    } catch (err) {
      console.log(err);
      ctx.reply('⚠️ Ошибка обработки файла');
    }
  }
  bot.start((ctx) => ctx.reply(`Привет! 👋
  Меня зовут Арти, я начинающий художник 🎨. 
  У меня уже кое что получается. 
  Например, вчера, я научился создавать картины 🖼️ в новом стиле.
  Но мне нужно больше практики и нужна твоя помощь! Можешь отправить своё фото ?
  `));
  bot.help((ctx) => ctx.reply('Отправь мне фото 🖼️'));
  bot.on('sticker', (ctx) => ctx.reply('👍'));
  bot.on('photo', onPhotos);
  bot.hears('hi', (ctx) => ctx.reply('Привет! 👋'));
  bot.launch();
}

startExpress();
startBot();
