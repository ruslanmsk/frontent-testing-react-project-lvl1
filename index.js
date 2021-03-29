// https://guides.hexlet.io/vscode-js-setup/

import axios from 'axios';
import fsp from 'fs/promises';
import cheerio from 'cheerio';
import path from 'path';
import debug from 'debug';

const log = debug('page-loader');

function generateFileNameImg(url, src) {
  const localUrl = new URL(url);
  const srcUrl = new URL(src, url);
  const srcUrlArr = (srcUrl.host + srcUrl.pathname).split('.');
  srcUrlArr.splice(-1, 1);
  let srcUrlTrue = srcUrlArr.join('.');
  const urlWithoutHost = `${localUrl.host}${localUrl.pathname}`;
  if (localUrl.pathname === src) {
    srcUrlTrue = (srcUrl.host + srcUrl.pathname);
  }
  const extname = path.extname(src) || '.html';
  const filename = `${urlWithoutHost.replace(/\W/g, '-')}_files/${srcUrlTrue.replace(/\W/g, '-')}${extname}`;
  return filename;
}

async function downloadResource(url, savedir) {
  log(url);
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

export default async function pageLoader(urlStr, outputDir) {
  const url = new URL(urlStr);
  const urlWithoutProtocol = `${url.host}${url.pathname}`;
  const urlName = `${urlWithoutProtocol.replace(/\W/g, '-')}`;

  const folderPath = `${outputDir}/${urlName}_files`;
  await fsp.mkdir(folderPath, { recursive: true });

  const response = await axios.get(url.href);
  const resultHtml = await exctractResources(response.data, outputDir, urlStr);

  const filePath = `${outputDir}/${urlName}.html`;
  await fsp.writeFile(filePath, resultHtml);
  return filePath;
}

// pageLoader('https://ororo3.tv', process.cwd());
