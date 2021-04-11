import nock from 'nock';
import loadPage from '../index.js';

const url = 'https://mail.ru';

beforeAll(() => {
  nock.disableNetConnect();
});

describe('errors test', () => {
  test('http', async () => {
    nock(url)
      .get('/')
      .replyWithError(`getaddrinfo ENOTFOUND ${url}`);

    return expect(loadPage(url)).rejects.toMatchObject({ message: `getaddrinfo ENOTFOUND ${url}` });
  });
});
