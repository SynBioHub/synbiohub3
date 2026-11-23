import axios from 'axios';
import Link from 'next/link';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import Loading from '../components/Reusable/Loading';
import TopLevel from '../components/TopLevel';
import Shell from '../components/Viewing/Shell';
import getMetadata from '../sparql/getMetadata';
import getOwner from '../sparql/getOwner';
import getQueryResponse from '../sparql/tools/getQueryResponse';
import { addError } from '../redux/actions';
import LinkedSearch from '../components/Search/StandardSearch/LinkedSearch';

const centerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  marginTop: '-10vh'
};

function PageNotFound({ url, showLoginLink }) {
  const defaultLogo = '/images/logo.svg';
  const [logoUrl, setLogoUrl] = useState(() => {
    try {
      const theme = JSON.parse(localStorage.getItem('theme') || '{}');
      return theme.logoUrl || localStorage.getItem('sbh_logo') || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (logoUrl) return;
    let isMounted = true;
    fetch(`${publicRuntimeConfig.backend}/logo`, {
      method: 'GET',
      cache: 'no-store'
    })
      .then(res => {
        if (!res.ok) throw new Error('No logo');
        return res.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!isMounted) return;
          const dataUrl = reader.result;
          try {
            localStorage.setItem('sbh_logo', dataUrl);
            const updatedTheme = JSON.parse(
              localStorage.getItem('theme') || '{}'
            );
            updatedTheme.logoUrl = dataUrl;
            localStorage.setItem('theme', JSON.stringify(updatedTheme));
          } catch {
            // ignore storage errors
          }
          setLogoUrl(dataUrl);
        };
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        if (isMounted) setLogoUrl(defaultLogo);
      });
    return () => {
      isMounted = false;
    };
  }, [logoUrl]);

  const next = encodeURIComponent(
    typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search || ''}`
      : url
      ? `/${url}`
      : '/'
  );

  return (
    <TopLevel publicPage={true}>
      <div style={centerStyle}>
        <img
          src={logoUrl || defaultLogo}
          alt="Logo"
          style={{
            maxWidth: '240px',
            maxHeight: '120px',
            objectFit: 'contain',
            marginBottom: '20px'
          }}
        />
        <div style={{ textAlign: 'center' }}>
          <h1>Page Not Found</h1>
          <p>
            The requested URL {url && <code>{`/${url}`}</code>} was not found on
            this server.
          </p>
          {showLoginLink ? (
            <p>
              You may need to sign in to view this page.{' '}
              <Link href={`/login?next=${next}`}>
                <a>Log in</a>
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </TopLevel>
  );
}

export default function View({ data, error }) {
  const dispatch = useDispatch();
  if (error) {
    dispatch(addError(error));
  }
  const router = useRouter();
  const { view } = router.query;
  const token = useSelector(state => state.user.token);
  const loggedIn = useSelector(state => state.user.loggedIn);
  const username = useSelector(state => state.user.username);
  const userGraphUri = useSelector(state => state.user.graphUri);
  const url = view ? view.join('/') : '';
  const [metadata, setMetadata] = useState();
  const [uriPrefix, setUriPrefix] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('theme') || '{}').uriPrefix || null;
    } catch {
      return null;
    }
  });
  const [requireLogin, setRequireLogin] = useState(() => {
    try {
      const storedTheme = JSON.parse(localStorage.getItem('theme') || '{}');
      return (
        storedTheme.requireLogin === true ||
        storedTheme.requireLogin === 'true'
      );
    } catch {
      return false;
    }
  });
  const [accessChecked, setAccessChecked] = useState(false);
  const [allowFetch, setAllowFetch] = useState(false);

  const isLinkedSearch =
    url.endsWith('/twins') || url.endsWith('/uses') || url.endsWith('/similar');
  const isSharePath = url.endsWith('/share');
  const urlSegments = typeof url === 'string' ? url.split('/') : [];
  const isPublicPath = urlSegments[0] === 'public';
  const isPrivateUserPath = urlSegments[0] === 'user' && !isSharePath;
  const urlUsername = isPrivateUserPath ? urlSegments[1] || '' : '';
  const isUrlOwner = Boolean(
    isPrivateUserPath && urlUsername && username && urlUsername === username
  );
  const requiresAuth = requireLogin || isPrivateUserPath;
  const needsLoginRedirect = requiresAuth && (!loggedIn || !token);

  useEffect(() => {
    if (!router.isReady) return;
    if (needsLoginRedirect) {
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
    }
  }, [router, needsLoginRedirect]);

  useEffect(() => {
    if (isLinkedSearch || needsLoginRedirect) {
      setAccessChecked(true);
      setAllowFetch(false);
      return;
    }

    const canFetch =
      isSharePath ||
      isPublicPath ||
      (isPrivateUserPath && Boolean(loggedIn && token));

    setAllowFetch(Boolean(canFetch));
    setAccessChecked(true);
  }, [
    isSharePath,
    isPublicPath,
    isPrivateUserPath,
    loggedIn,
    token,
    isLinkedSearch,
    needsLoginRedirect
  ]);

  // On a cold first visit (e.g. a share link pasted into incognito) the theme
  // is not in localStorage yet. TopLevel fetches it asynchronously, but this
  // page is TopLevel's parent, so that write never re-renders us: fetch the
  // theme here instead. Until uriPrefix is known, uri stays null so the
  // metadata fetch below waits instead of querying for the literal URI
  // "undefined/<path>", which returns no metadata.
  useEffect(() => {
    if (isLinkedSearch || uriPrefix) return;
    axios
      .get(`${publicRuntimeConfig.backend}/admin/theme`, {
        headers: { Accept: 'application/json' }
      })
      .then(response => {
        if (response.data && response.data.uriPrefix) {
          localStorage.setItem('theme', JSON.stringify(response.data));
          setUriPrefix(response.data.uriPrefix);
          setRequireLogin(
            response.data.requireLogin === true ||
              response.data.requireLogin === 'true'
          );
        }
      })
      .catch(() => {});
  }, [uriPrefix, isLinkedSearch]);

  const uri = uriPrefix ? `${uriPrefix}${url}` : null;

  useEffect(() => {
    if (
      isLinkedSearch ||
      needsLoginRedirect ||
      !accessChecked ||
      !allowFetch ||
      metadata ||
      !uri
    ) {
      return;
    }
    let isMounted = true;
    const uriParts = uri.split('/');
    // Share links end in /<hash>/share; the hash is not part of the object URI
    // and can start with a digit, which would fool the version scan below.
    const objectParts = uri.endsWith('/share') ? uriParts.slice(0, -2) : uriParts;
    // Find the last index that looks like a version number (contains digits)
    let lastIndex = -1;
    for (let i = objectParts.length - 1; i >= 0; i--) {
      if (objectParts[i] && /^\d/.test(objectParts[i])) {
        lastIndex = i;
        break;
      }
    }
    const firstHalf =
      lastIndex >= 0 ? objectParts.slice(0, lastIndex + 1).join('/') : uri;

    const loadMetadata = async () => {
      if (isPrivateUserPath && !isUrlOwner) {
        const permitted = await hasPrivateViewAccess(
          firstHalf,
          token,
          username,
          userGraphUri,
          dispatch
        );
        if (!permitted) {
          if (isMounted) setMetadata([]);
          return;
        }
      }
      const result = await getQueryResponse(
        dispatch,
        getMetadata,
        { uri: firstHalf },
        token
      );
      if (isMounted) {
        setMetadata(Array.isArray(result) ? result : []);
      }
    };

    loadMetadata();

    return () => {
      isMounted = false;
    };
  }, [
    uri,
    metadata,
    token,
    username,
    userGraphUri,
    isPrivateUserPath,
    isUrlOwner,
    dispatch,
    accessChecked,
    allowFetch,
    isLinkedSearch,
    needsLoginRedirect
  ]);

  if (needsLoginRedirect) {
    return (
      <TopLevel publicPage={false}>
        <Loading />
      </TopLevel>
    );
  }

  if (url.endsWith('/twins')) {
    return (
      <LinkedSearch
        url={`${publicRuntimeConfig.backend}/${url}`}
        uri={url}
      />
    );
  }
  if (url.endsWith('/uses')) {
    return (
      <LinkedSearch
        url={`${publicRuntimeConfig.backend}/${url}`}
        uri={url}
      />
    );
  }
  if (url.endsWith('/similar')) {
    return (
      <LinkedSearch
        url={`${publicRuntimeConfig.backend}/${url}`}
        uri={url}
      />
    );
  }

  if (!accessChecked) {
    return (
      <TopLevel publicPage={true}>
        <Loading />
      </TopLevel>
    );
  }

  if (!url || !allowFetch) {
    return (
      <PageNotFound
        url={url}
        showLoginLink={false}
      />
    );
  }

  if (!uri || !metadata) {
    // Still loading the instance theme (uri unknown) or the object metadata.
    return (
      <TopLevel publicPage={true}>
        <Loading />
      </TopLevel>
    );
  }

  if (metadata.length === 0) {
    return (
      <PageNotFound
        url={url}
        showLoginLink={false}
      />
    );
  }

  return (
    <TopLevel publicPage={true}>
      <Shell
        plugins={data}
        metadata={metadata[0]}
        type={getType(metadata[0].types)}
        uri={uri}
      />
    </TopLevel>
  );
}

// eslint-disable-next-line unicorn/prevent-abbreviations
export async function getServerSideProps() {
  // Fetch data from external API
  try {
    const response = await axios.get(
      `${publicRuntimeConfig.backendSS}/admin/plugins`,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    );

    const data = response.data;
    // Pass data to the page via props
    return { props: { data } };
  } catch (error) {
    return {
      props: {
        error: {
          customMessage:
            'Request and/or processing failed for GET /admin/plugins',
          fullUrl: `${publicRuntimeConfig.backendSS}/admin/plugins`,
          message: error.message,
          name: 'Server side error',
          stack: error.stack
        },
        data: []
      }
    };
  }
}

const getType = type => {
  if (type) {
    return type.replace('http://sbols.org/v2#', '');
  }

  return type;
};

function getCollectionPrefix(objectUri) {
  if (typeof objectUri !== 'string') return '';
  const match = objectUri.match(/^(.*\/user\/[^/]+\/[^/]+\/)/);
  return match ? match[1] : '';
}

async function hasPrivateViewAccess(
  firstHalf,
  token,
  username,
  userGraphUri,
  dispatch
) {
  try {
    const sharedRes = await axios.get(`${publicRuntimeConfig.backend}/shared`, {
      headers: {
        Accept: 'text/plain',
        'X-authorization': token
      }
    });
    const sharedItems = Array.isArray(sharedRes.data) ? sharedRes.data : [];
    const collectionPrefix = getCollectionPrefix(firstHalf);
    const matchesShared = sharedItems.some(item => {
      const itemUri = item && item.uri;
      if (!itemUri) return false;
      if (itemUri === firstHalf) return true;
      return (
        Boolean(collectionPrefix) &&
        getCollectionPrefix(itemUri) === collectionPrefix
      );
    });
    if (matchesShared) return true;
  } catch {
    // fall through to owner check
  }

  try {
    const owners = await getQueryResponse(
      dispatch,
      getOwner,
      { uri: firstHalf },
      token
    );
    if (
      Array.isArray(owners) &&
      owners.some(
        res =>
          res.ownedBy &&
          ((userGraphUri && res.ownedBy === userGraphUri) ||
            (username && res.ownedBy.endsWith(`/user/${username}`)))
      )
    ) {
      return true;
    }
  } catch {
    // denied
  }

  return false;
}
