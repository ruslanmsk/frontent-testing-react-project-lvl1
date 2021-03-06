import axios from 'axios';
import fsp from 'fs/promises';
import cheerio from 'cheerio';
import path from 'path';
import debug from 'debug';
import process from 'process';

const log = debug('page-loader');

function generateFileName(url, src) {
  const srcUrl = new URL(src, url);
  const { dir, name, ext } = path.parse(`${srcUrl.host}${srcUrl.pathname}`);
  const urlWithoutProtocol = `${url.host}${url.pathname}`;
  const extname = ext || '.html';
  const filename = `${urlWithoutProtocol.replace(/\W/g, '-').replace(/-$/g, '')}_files/${path.join(dir, name).replace(/\W/g, '-')}${extname}`;
  return filename;
}

async function downloadResource(url, savedir) {
  log(url);
  const response = await axios({ url, responseType: 'arraybuffer' });
  await fsp.writeFile(savedir, response.data);
}

const resourceMapping = {
  img: 'src',
  link: 'href',
  script: 'src',
};

async function exctractResources(html, outputDirectory, url) {
  const $ = cheerio.load(html, { decodeEntities: true });

  const promises = [];

  Object.entries(resourceMapping).forEach(([type, attr]) => {
    const promise = Array.from($(type))
      .map((resource) => $(resource))
      .filter((resource) => resource.attr(attr))
      .filter((resource) => new URL(resource.attr(attr), url.origin).origin === url.origin)
      .map(async (resource) => {
        const attributeLink = resource.attr(attr);
        const filename = generateFileName(url, attributeLink);
        resource.attr(attr, filename);
        return downloadResource(
          new URL(attributeLink, url.origin).href, path.join(outputDirectory, filename),
        );
      });

    promises.push(promise);
  });

  await Promise.all(promises);

  return $.html();
}

export default async function pageLoader(urlStr, outputDir = '') {
  const url = new URL(urlStr);
  const urlWithoutProtocol = `${url.host}${url.pathname}`;
  const urlName = urlWithoutProtocol.replace(/\W/g, '-').replace(/-$/g, '');

  const fullOutputDir = path.resolve(process.cwd(), outputDir);
  const fullFolderPath = path.join(fullOutputDir, `${urlName}_files`);
  await fsp.mkdir(fullFolderPath, { recursive: true });

  const response = await axios.get(url.href);
  const resultHtml = await exctractResources(response.data, fullOutputDir, url);

  const filePath = path.join(fullOutputDir, `${urlName}.html`);
  await fsp.writeFile(filePath, resultHtml);
  return filePath;
}

// pageLoader('https://ororo.tv');
