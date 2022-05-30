import { convertToHttps } from './convert-https';

describe('convert to https', () => {
  it('google.com', () => {
    expect(convertToHttps('google.com')).toStrictEqual('https://google.com');
  });

  it('https://google.com', () => {
    expect(convertToHttps('https://google.com')).toStrictEqual(
      'https://google.com',
    );
  });

  it('http://google.com', () => {
    expect(convertToHttps('http://google.com')).toStrictEqual(
      'http://google.com',
    );
  });
});
