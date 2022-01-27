import axios from 'axios';
import getConfig from 'next/config';
import useSWR from 'swr';

import styles from '../../styles/defaulttable.module.css';
import Loading from '../Reusable/Loading';
const { publicRuntimeConfig } = getConfig();

export default function Theme() {
  const { theme, loading } = useTheme();
  if (loading) return <Loading />;
  return (
    <div>
      <div>Logo</div>
      <input type="file" />
      <div>Instance Name</div>
      <input type="text" value={theme.instanceName} />
      <div>Front page description</div>
      <textarea value={theme.frontPageText} />
      <div>Color Settings</div>
      <table className={styles.table}>
        <tbody>
          <tr>
            <td>Base Color</td>
            <td>{theme.themeParameters[0].value}</td>
          </tr>
        </tbody>
      </table>
      <div>
        <input type="checkbox" checked={true} />
        Show module interactions
      </div>
      <div>
        <input type="checkbox" checked={true} />
        Remove public enabled
      </div>
      <button>Save</button>
    </div>
  );
}

const useTheme = () => {
  const { data, error } = useSWR(
    [`${publicRuntimeConfig.backend}/admin/theme`],
    fetcher
  );
  return {
    theme: data,
    loading: !error && !data
  };
};

const fetcher = url =>
  axios
    .get(url, {
      headers: {
        Accept: 'application/json'
      }
    })
    .then(response => response.data);
