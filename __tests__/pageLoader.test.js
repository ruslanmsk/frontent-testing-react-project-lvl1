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
    url: 'https://ru.hexlet.io/packs/js/runtime.js',
  },
  // {
  //   format: 'html',
  //   filename: 'ru-hexlet-io-courses',
  //   url: 'https://ru.hexlet.io/courses.html',
  // },
];

let originalPageContent;
let expectedPageContent;
let tmpDir;

beforeAll(async () => {
  const fixtureOriginalPath = getFixturePath('original');
  const fixtureExpectedPath = getFixturePath('expected');

  originalPageContent = await readFile(fixtureOriginalPath);
  expectedPageContent = await readFile(fixtureExpectedPath);

  const promises = resources.map((recource) => {
    const fixturePath = getFixturePath(recource.filename, recource.format);
    return readFile(fixturePath).then((content) => recource.content = content);
  });

  await Promise.all(promises);

  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

  nock.disableNetConnect();
});

describe('page loader test', () => {
  it('download page', async () => {
    nock(fullUrl)
      .persist()
      .get('')
      .reply(200, originalPageContent);

    resources.forEach((resource) => {
      nock(fullUrl)
        .persist()
        .get(resource.url)
        .reply(200, resource.content);
    });

    const loaderFilepath = await loadPage(fullUrl, tmpDir);
    const expectedFilepath = `${tmpDir}/${expectedFilename}`;

    // expect(nock.isDone()).toBeTruthy();
    expect(loaderFilepath).toBe(expectedFilepath);

    const loaderContent = await readFile(loaderFilepath);
    expect(prettifyHtml(loaderContent)).toBe(prettifyHtml(expectedPageContent));
  });

  test.each(resources)('download files', async (resource) => {
    const fixtureFilepath = `${tmpDir}/${expectedFolder}/${resource.filename}.${resource.format}`;
    const resultContent = await readFile(fixtureFilepath);
    expect(resultContent).toBe(resource.content);
  });
});

// afterAll(async () => {
//   await fsp.rmdir(tmpDir, { recursive: true });
// });
