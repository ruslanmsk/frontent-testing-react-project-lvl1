// https://guides.hexlet.io/vscode-js-setup/

import axios from 'axios';
import fsp from 'fs/promises';
import cheerio from 'cheerio';
import path from 'path';

function generateFileNameFolder(dir, url) {
  const localUrl = new URL(url);
  const urlWithoutHost = `${localUrl.host}${localUrl.pathname !== '/' ? localUrl.pathname : ''}`;
  const foldername = `${dir}/${urlWithoutHost.replace(/\W/g, '-')}_files`;
  return foldername;
}

function generateFileName(dir, url) {
  const localUrl = new URL(url);
  const urlWithoutHost = `${localUrl.host}${localUrl.pathname !== '/' ? localUrl.pathname : ''}`;
  const filename = `${dir}/${urlWithoutHost.replace(/\W/g, '-')}.html`;
  return filename;
}

function generateFileNameImg(url, src) {
  const localUrl = new URL(url);
  const urlWithoutHost = `${localUrl.host}${localUrl.pathname !== '/' ? localUrl.pathname : ''}`;
  const extname = path.extname(src);
  const filename = `${urlWithoutHost.replace(/\W/g, '-')}_files/${localUrl.host.replace(/\W/g, '-')}${src.split(extname)[0].replace(/\W/g, '-')}${extname}`;
  return filename;
}

async function downloadImage(url, savedir) {
  try {
    const response = await axios({
      method: 'get',
      url,
      responseType: 'arraybuffer',
    });
    await fsp.writeFile(savedir, response.data);
  } catch (err) {
    console.log(err);
  }
}

async function exctractImages(html, outputDirectory, url) {
  const $ = cheerio.load(html);

  await Promise.all(Array.from($('img'))
    .filter((image) => !/^(https?:)?\/\//g.test(image.attribs.src))
    .map(async (image) => {
      const { src } = image.attribs;
      const filename = generateFileNameImg(url, src);
      // TODO: убрать
      // eslint-disable-next-line no-param-reassign
      image.attribs.src = filename;
      return downloadImage(url + src, `${outputDirectory}/${filename}`);
    }));

  return $.html();
}

export default async function pageLoader(url, outputDirectory) {
  const filename = generateFileName(outputDirectory, url);
  const response = await axios.get(url);

  const filesPath = generateFileNameFolder(outputDirectory, url);

  await fsp.mkdir(filesPath, { recursive: true });
  const newHtml = await exctractImages(response.data, outputDirectory, url);

  await fsp.writeFile(filename, newHtml);
  return filename;
}

// pageLoader('https://ororo.tv', process.cwd());
