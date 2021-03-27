// https://guides.hexlet.io/vscode-js-setup/

import axios from 'axios';
import fsp from 'fs/promises';
import cheerio from 'cheerio';
import path from 'path';

function generateFileNameFolder(dir, url) {
  const localUrl = new URL(url);
  const urlWithoutProtocol = `${localUrl.host}${localUrl.pathname !== '/' ? localUrl.pathname : ''}`;
  const foldername = `${dir}/${urlWithoutProtocol.replace(/\W/g, '-')}_files`;
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
  const srcUrl = new URL(src, url);
  const srcUrlArr = (srcUrl.host + srcUrl.pathname).split('.');
  srcUrlArr.splice(-1, 1);
  let srcUrlTrue = srcUrlArr.join('.');
  const urlWithoutHost = `${localUrl.host}${localUrl.pathname !== '/' ? localUrl.pathname : ''}`;
  if (localUrl.pathname === src) {
    srcUrlTrue = (srcUrl.host + srcUrl.pathname);
  }
  const extname = path.extname(src) || '.html';
  const filename = `${urlWithoutHost.replace(/\W/g, '-')}_files/${srcUrlTrue.replace(/\W/g, '-')}${extname}`;
  return filename;
}

async function downloadResource(url, savedir) {
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

const resourceMapping = {
  img: 'src',
  link: 'href',
  script: 'src',
};

function replace(type, $, url, outputDirectory) {
  const attr = resourceMapping[type];
  const promises = Array.from($(type))
    .filter((resource) => new URL(resource.attribs[attr], new URL(url).origin).href.startsWith(new URL(url).origin))
    .filter((resource) => resource.attribs[attr])
    // .filter((resource) => !/^(https?:)?\/\//g.test(resource.attribs[attr]))
    .map(async (resource) => {
      const attributeLink = resource.attribs[attr];
      const filename = generateFileNameImg(url, attributeLink);
      // eslint-disable-next-line no-param-reassign
      resource.attribs[attr] = filename;
      return downloadResource(url + attributeLink, `${outputDirectory}/${filename}`);
    });

  return promises;
}

async function exctractResources(html, outputDirectory, url) {
  const $ = cheerio.load(html);

  const promises = replace('img', $, url, outputDirectory);
  const promises2 = replace('link', $, url, outputDirectory);
  const promises3 = replace('script', $, url, outputDirectory);

  await Promise.all([...promises, ...promises2, ...promises3]);

  return $.html();
}

export default async function pageLoader(url, outputDirectory) {
  const response = await axios.get(url);

  const filesPath = generateFileNameFolder(outputDirectory, url);
  await fsp.mkdir(filesPath, { recursive: true });
  const resultHtml = await exctractResources(response.data, outputDirectory, url);

  const filename = generateFileName(outputDirectory, url);
  await fsp.writeFile(filename, resultHtml);
  return filename;
}

pageLoader('https://ororo.tv', process.cwd());
