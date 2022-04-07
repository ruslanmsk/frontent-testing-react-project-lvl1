import path from 'path';
import fsp from 'fs/promises';
import os from 'os';
import prettifyHtml from 'prettify-html';

import nock from 'nock';
import loadPage from '../index.js';

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

const scope = nock(siteUrl);

beforeAll(async () => {
  nock.disableNetConnect();

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

  scope
    .get(sitePath)
    .reply(200, originalPageContent);

  resources.forEach((resource) => {
    scope
      .get(resource.url)
      .reply(200, resource.content);
  });
});

describe('positive cases', () => {
  let tmpDir;
  beforeAll(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    await loadPage(fullUrl, tmpDir);
  });

  test('web page', async () => {
    const loaderFilepath = path.join(tmpDir, expectedFilename);
    const loaderContent = await readFile(loaderFilepath);
    expect(prettifyHtml(loaderContent)).toBe(prettifyHtml(expectedPageContent));
  });

  test.each(resources)('resource files', async (resource) => {
    const fixtureFilepath = `${tmpDir}/${expectedFolder}/${resource.filename}.${resource.format}`;
    const resultContent = await readFile(fixtureFilepath);
    expect(resultContent).toBe(resource.content);
  });
});

describe('negative cases', () => {
  let tmpDir;
  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  });

  test.each([404, 500])('%s error', async (code) => {
    scope.get(`/${code}`).reply(code);
    const url = new URL(`/${code}`, siteUrl).toString();
    await expect(loadPage(url, tmpDir)).rejects.toThrow(`${code}`);
  });
});

afterAll(async () => {
  nock.enableNetConnect();
  // await fsp.rmdir(tmpDir, { recursive: true });
});
