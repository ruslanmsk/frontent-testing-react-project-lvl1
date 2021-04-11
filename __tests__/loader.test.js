import path from 'path';
import fsp from 'fs/promises';
import os from 'os';
import prettifyHtml from 'prettify-html';

import nock from 'nock';
import { fileURLToPath } from 'url';
import loadPage from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filename, extenstion = 'html') => path.join(__dirname, '..', '__fixtures__', `${filename}.${extenstion}`);
const readFile = (filepath) => fsp.readFile(filepath, 'utf-8');

const siteUrl = 'https://ru.hexlet.io';
const sitePath = '/courses';
const fullUrl = `${siteUrl}${sitePath}`;
const expectedFilename = 'ru-hexlet-io-courses.html';
const expectedFolder = 'ru-hexlet-io-courses_files';

const resources = [
  {
    format: 'png',
    filename: 'ru-hexlet-io-assets-professions-nodejs',
    url: '/assets/professions/nodejs.png',
  },
  {
    format: 'css',
    filename: 'ru-hexlet-io-assets-application',
    url: '/assets/application.css',
  },
  {
    format: 'js',
    filename: 'ru-hexlet-io-packs-js-runtime',
    url: '/packs/js/runtime.js',
  },
  {
    format: 'html',
    filename: 'ru-hexlet-io-courses',
    url: '/courses',
  },
];

let originalPageContent;
let expectedPageContent;
let tmpDir;

beforeAll(async () => {
  const fixtureOriginalPath = getFixturePath('original');
  const fixtureExpectedPath = getFixturePath('expected');

  originalPageContent = await readFile(fixtureOriginalPath);
  expectedPageContent = await readFile(fixtureExpectedPath);

  const promises = resources.map((resource) => {
    const fixturePath = getFixturePath(resource.filename, resource.format);
    return readFile(fixturePath).then((content) => {
      // eslint-disable-next-line no-param-reassign
      resource.content = content;
    });
  });

  await Promise.all(promises);

  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

  nock.disableNetConnect();
});

describe('page loader', () => {
  test('web page', async () => {
    nock(siteUrl)
      .get(sitePath)
      .reply(200, originalPageContent);

    resources.forEach((resource) => {
      nock(siteUrl)
        .get(resource.url)
        .reply(200, resource.content);
    });

    const loaderFilepath = await loadPage(fullUrl, tmpDir);
    const expectedFilepath = `${tmpDir}/${expectedFilename}`;

    expect(nock.isDone()).toBeTruthy();
    expect(loaderFilepath).toBe(expectedFilepath);

    const loaderContent = await readFile(loaderFilepath);
    expect(prettifyHtml(loaderContent)).toBe(prettifyHtml(expectedPageContent));
  });

  test.each(resources)('resource files', async (resource) => {
    const fixtureFilepath = `${tmpDir}/${expectedFolder}/${resource.filename}.${resource.format}`;
    const resultContent = await readFile(fixtureFilepath);
    expect(resultContent).toBe(resource.content);
  });
});

// afterAll(async () => {
//   await fsp.rmdir(tmpDir, { recursive: true });
// });
