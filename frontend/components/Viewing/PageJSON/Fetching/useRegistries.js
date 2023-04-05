import getConfig from 'next/config';
import axios from 'axios';

const { publicRuntimeConfig } = getConfig();

import useSWR from 'swr';

export const fetcher = url =>
  axios.get(url, { headers: { accept: 'text/plain' } }).then(res => res.data);

export default function useRegistries() {
  const { data, error } = useSWR(
    `${publicRuntimeConfig.backend}/admin/registries`,
    fetcher
  );
  return {
    registries: data && data.registries,
    loading: !error && !data,
    error: error
  };
}
