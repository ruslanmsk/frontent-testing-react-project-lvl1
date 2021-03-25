// Проверить имя файла на выходе
// Замокать запрос по http
// Проверить контент как в содержимом

import path from 'path';
import fsp from 'fs/promises';
import os from 'os';

import nock from 'nock';
import { fileURLToPath } from 'url';
import loadPage from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFixturePath(filename) {
  return path.join(__dirname, '..', '__fixtures__', `${filename}.html`);
}

function readFile(filepath) {
  return fsp.readFile(filepath, 'utf-8');
}

const url = 'https://ru.hexlet.io';
const sitePath = '/courses';
const fullUrl = `${url}${sitePath}`;
const expectedFilename = 'ru-hexlet-io-courses.html';

let pageContent;
let tmpDir;

beforeAll(async () => {
  const fixturePath = getFixturePath('page');
  pageContent = await readFile(fixturePath);
});

beforeEach(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

describe('page loader test', () => {
  it('simple page', async () => {
    expect.hasAssertions();

    nock(url)
      .get(sitePath)
      .reply(200, pageContent);

    const result = await loadPage(fullUrl, tmpDir);
    const resultFilepath = `${tmpDir}/${expectedFilename}`;

    expect(result).toBe(`${tmpDir}/${expectedFilename}`);
    const resultContent = await readFile(resultFilepath);
    await expect(resultContent).toBe(pageContent);
  });
});
