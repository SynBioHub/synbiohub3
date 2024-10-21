import axios from 'axios';

import feConfig from "../../../../config.json";

import useSWR from 'swr';
import { addError } from '../../../../redux/actions';

export const fetcher = (url, dispatch) =>
  axios
    .get(url, { headers: { accept: 'text/plain' } })
    .then(res => res.data)
    .catch(error => {
      error.customMessage = 'Request failed for GET /admin/registries';
      error.fullUrl = url;
      dispatch(addError(error));
    });

export default function useRegistries(dispatch) {
  const { data, error } = useSWR(
    [`${feConfig.backend}/admin/registries`, dispatch],
    fetcher
  );
  return {
    registries: data && data.registries,
    loading: !error && !data,
    error: error
  };
}
