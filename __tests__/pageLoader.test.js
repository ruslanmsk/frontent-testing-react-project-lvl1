import path from 'path';
import fsp from 'fs/promises';
import os from 'os';
import prettifyHtml from 'prettify-html';

import nock from 'nock';
import { fileURLToPath } from 'url';
import loadPage from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFixturePath(filename, extenstion = 'html') {
  return path.join(__dirname, '..', '__fixtures__', `${filename}.${extenstion}`);
}

function readFile(filepath) {
  return fsp.readFile(filepath, 'utf-8');
}

const fullUrl = 'https://ru.hexlet.io/courses';
const expectedFilename = 'ru-hexlet-io-courses.html';
const expectedFolder = 'ru-hexlet-io-courses_files';

let originalPageContent;
let expectedPageContent;
let expectedImageContent;
let tmpDir;

beforeAll(async () => {
  const fixtureOriginalPath = getFixturePath('original');
  const fixtureExpectedPath = getFixturePath('expected');
  const fixtureImagePath = getFixturePath('node', 'png');

  originalPageContent = await readFile(fixtureOriginalPath);
  expectedPageContent = await readFile(fixtureExpectedPath);
  expectedImageContent = await readFile(fixtureImagePath);

  nock.disableNetConnect();
});

beforeEach(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

describe('page loader test', () => {
  it('download image', async () => {
    nock(fullUrl)
      .persist()
      .get('')
      .reply(200, originalPageContent)
      .get('/assets/professions/nodejs.png')
      .reply(200, expectedImageContent, {
        'Content-Type': 'image/png',
      });

    const result = await loadPage(fullUrl, tmpDir);
    const resultFilepath = `${tmpDir}/${expectedFilename}`;

    expect(nock.isDone()).toBeTruthy();
    expect(result).toBe(resultFilepath);

    const resultContent = await readFile(resultFilepath);
    expect(prettifyHtml(resultContent)).toBe(prettifyHtml(expectedPageContent));

    const imgFilepath = `${tmpDir}/${expectedFolder}/ru-hexlet-io-assets-professions-nodejs.png`;

    const resultContent2 = await readFile(imgFilepath);
    expect(resultContent2).toBe(expectedImageContent);
  });
});

afterAll(async () => {
  await fsp.rmdir(tmpDir, { recursive: true });
});
