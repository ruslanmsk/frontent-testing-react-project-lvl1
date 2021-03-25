import axios from 'axios';
import fsp from 'fs/promises';
// import process from 'process';

function generateFileName(dir, url) {
  const localUrl = new URL(url);
  const urlWithoutHost = `${localUrl.host}${localUrl.pathname !== '/' ? localUrl.pathname : ''}${localUrl.search}`;
  const filename = `${dir}/${urlWithoutHost.replace(/\W/g, '-')}.html`;
  return filename;
}

export default async function pageLoader(url, outputDirectory) {
  const filename = generateFileName(outputDirectory, url);
  const response = await axios.get(url);
  await fsp.writeFile(filename, response.data);
  return filename;
}

// pageLoader('https://mail.ru', process.cwd());
