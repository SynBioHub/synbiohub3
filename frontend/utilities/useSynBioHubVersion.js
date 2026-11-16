import axios from 'axios';
import getConfig from 'next/config';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const { publicRuntimeConfig } = getConfig();

/**
 * Resolves backend major version via /getSynBioHubVersion.
 * Returns null while loading, otherwise 3 for SBH3 or 1 for SBH1-compatible backends.
 */
export default function useSynBioHubVersion() {
  const token = useSelector(state => state.user.token);
  const [version, setVersion] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${publicRuntimeConfig.backend}/getSynBioHubVersion`, {
        headers: {
          Accept: 'application/json',
          'X-authorization': token || ''
        }
      })
      .then(response => {
        if (cancelled) return;
        const raw =
          typeof response.data === 'object' && response.data !== null
            ? response.data.version
            : response.data;
        setVersion(Number(raw) === 3 ? 3 : 1);
      })
      .catch(() => {
        if (!cancelled) setVersion(1);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return version;
}
