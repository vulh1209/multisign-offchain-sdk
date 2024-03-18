import { Api } from './sdk';

const client = new Api({
  format: 'json',
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export default client;
