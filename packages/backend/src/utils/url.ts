type Nullable<T> = T | null;

type Host = {
  hostname: Nullable<string>;
  port: Nullable<string>;
};

type Url = {
  protocol: Nullable<string>;
  slashes: Nullable<boolean>;
  auth: Nullable<string>;
  host: Nullable<string>;
  port: Nullable<string>;
  hostname: Nullable<string>;
  hosts: Host[];
  hash: Nullable<string>;
  search: Nullable<string>;
  query: Nullable<string>;
  pathname: Nullable<string>;
  path: Nullable<string>;
  href: Nullable<string>;
};

export const parse = (url: string): Url => {
  let remaining = url;

  const result: Url = {
    protocol: null,
    slashes: null,
    auth: null,
    host: null,
    port: null,
    hostname: null,
    hosts: [],
    hash: null,
    search: null,
    query: null,
    pathname: null,
    path: null,
    href: remaining,
  };

  let parts = remaining.split('//');
  if (parts.length > 1) {
    [result.protocol] = parts;
    result.slashes = true;
    remaining = parts.slice(1).join('//');
  }

  parts = remaining.split('@');
  if (parts.length > 1) {
    [result.auth] = parts;
    remaining = parts.slice(1).join('@');
  }

  parts = remaining.split('/');
  remaining = parts.slice(1).join('/');
  result.hosts = parts[0].split(',').map((host, index) => {
    const [hostname, port] = host.split(':');
    if (index === 0) {
      result.host = host;
      result.hostname = hostname;
      result.port = port || null;
    }
    return { hostname, port: port || null };
  });

  const hashIndex = remaining.indexOf('#');
  if (hashIndex > -1) {
    parts = remaining.split('#');
    result.hash = `#${parts.pop()}`;
    remaining = parts.join('#');
  }

  result.path = `/${remaining}`;
  const [pathname, query] = remaining.split('?');
  result.pathname = `/${pathname || ''}`;
  result.query = query || null;
  result.search = query ? `?${query}` : null;

  return result;
};

export const format = (url: Url): string =>
  [
    url.protocol,
    url.slashes && '//',
    url.auth && `${url.auth}@`,
    url.hosts.map(({ hostname, port }) => [hostname, port].filter(Boolean).join(':')).join(','),
    url.pathname,
    url.query && `?${url.query}`,
    url.hash,
  ]
    .filter(Boolean)
    .join('');

const parser = { parse, format };

export default parser;
