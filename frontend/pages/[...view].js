import axios from 'axios';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import Loading from '../components/Reusable/Loading';
import TopLevel from '../components/TopLevel';
import Shell from '../components/Viewing/Shell';
import getMetadata from '../sparql/getMetadata';
import getQueryResponse from '../sparql/tools/getQueryResponse';
import { addError } from '../redux/actions';
import LinkedSearch from '../components/Search/StandardSearch/LinkedSearch';


export default function View({ data, error }) {
  const dispatch = useDispatch();
  if (error) {
    dispatch(addError(error));
  }
  const router = useRouter();
  const { view } = router.query;
  const token = useSelector(state => state.user.token);
  const url = view ? view.join('/') : '';
  const [metadata, setMetadata] = useState();
  const [uriPrefix, setUriPrefix] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('theme') || '{}').uriPrefix || null;
    } catch {
      return null;
    }
  });
  const currentURL = window.location.href;
  const parts = currentURL.split('/');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const currentURL = window.location.href;
    const urlUsername = parts[4]; // adjust as needed
    const persistRoot = JSON.parse(localStorage.getItem("persist:root") || '{}');
    const rootUser = JSON.parse(persistRoot.username || '""');

    if (currentURL.endsWith('/share') || currentURL.includes('/public/') || urlUsername === rootUser) {
      setIsOwner(true);
    }
  }, []);


  if (url.endsWith('/twins')) {
    const searchUrl = `${publicRuntimeConfig.backend}/${url}`;
    return (
      <LinkedSearch
        url={searchUrl}
        uri={url}
      />
    )
  }
  if (url.endsWith('/uses')) {
    const searchUrl = `${publicRuntimeConfig.backend}/${url}`;
    return (
      <LinkedSearch
        url={searchUrl}
        uri={url}
      />
    )
  }
  if (url.endsWith('/similar')) {
    const searchUrl = `${publicRuntimeConfig.backend}/${url}`;
    return (
      <LinkedSearch
        url={searchUrl}
        uri={url}
      />
    )
  }

  const centerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh', // This makes sure it takes the full viewport height
    marginTop: '-10vh',
  };

  // On a cold first visit (e.g. a share link pasted into incognito) the theme
  // is not in localStorage yet. TopLevel fetches it asynchronously, but this
  // page is TopLevel's parent, so that write never re-renders us: fetch the
  // theme here instead. Until uriPrefix is known, uri stays null so the
  // metadata fetch below waits instead of querying for the literal URI
  // "undefined/<path>", which returns no metadata.
  useEffect(() => {
    if (uriPrefix) return;
    axios
      .get(`${publicRuntimeConfig.backend}/admin/theme`, {
        headers: { Accept: 'application/json' }
      })
      .then(response => {
        if (response.data && response.data.uriPrefix) {
          localStorage.setItem('theme', JSON.stringify(response.data));
          setUriPrefix(response.data.uriPrefix);
        }
      })
      .catch(() => {});
  }, [uriPrefix]);

  const uri = uriPrefix ? `${uriPrefix}${url}` : null;

  useEffect(() => {
    if (!metadata && uri) {
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
      getQueryResponse(dispatch, getMetadata, { uri: firstHalf }, token).then(
        result => setMetadata(result)
      );
    }
  }, [uri, metadata, token, dispatch]);

  if (!url || !isOwner) {
    return (
      <TopLevel publicPage={true}>
        <div style={centerStyle}>
          { /* Logo Here */}
          <img src="images/widevibe.gif" alt="Logo" style={{ marginBottom: '20px' }} />

          { /* Page Not Found Message */}
          <div>
            <h1>Page Not Found</h1>
            <p>The requested URL {url && <code>{`/${url}`}</code>} was not found on this server.</p>
          </div>
        </div>
      </TopLevel>
    );
  } else if (!uri || !metadata) {
    // Still loading the instance theme (uri unknown) or the object metadata.
    return (
      <TopLevel publicPage={true}>
        <Loading />
      </TopLevel>
    );
  } else if (metadata.length === 0) {
    return (
      <TopLevel publicPage={true}>
        <div style={centerStyle}>
          <h1>Page Not Found</h1>
          <p>The requested URL {url && <code>{`/${url}`}</code>} was not found on this server.</p>
        </div>
      </TopLevel>
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
