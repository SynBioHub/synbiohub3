import { faHatWizard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useState } from 'react';

import Options from '../components/Search/AdvancedSearch/Options';
import SearchHeader from '../components/Search/SearchHeader/SearchHeader';
import TopLevel from '../components/TopLevel';
import styles from '../styles/advancedsearch.module.css';

export default function AdvancedSearch() {
  const [creator, setCreator] = useState('');
  const [created, setCreated] = useState([
    {
      startDate: null,
      endDate: null,
      key: 'selection'
    }
  ]);
  const [modifed, setModified] = useState([
    {
      startDate: null,
      endDate: null,
      key: 'selection'
    }
  ]);
  const [keyword, setKeyword] = useState('');
  const [objectType, setObjectType] = useState('');
  const [role, setRole] = useState('');
  const [sbolType, setSbolType] = useState('');
  const [collections, setCollections] = useState([]);
  const [extraFilters, setExtraFilters] = useState([]);

  const router = useRouter();

  const constructSearch = () => {
    let collectionUrls = '';
    for (const collection of collections) {
      collectionUrls += getUrl(collection.value, 'collection');
    }
    const url = `/search/${getUrl(objectType, 'objectType')}${getUrl(
      creator,
      'dc:creator'
    )}${getUrl(role, 'sbol2:role')}${getUrl(
      sbolType,
      'sbol2:type'
    )}${collectionUrls}${getUrl(
      created[0].startDate,
      'createdAfter',
      true
    )}${getUrl(created[0].endDate, 'createdBefore', true)}${getUrl(
      modifed[0].startDate,
      'modifedAfter',
      true
    )}${getUrl(
      modifed[0].endDate,
      'modifedBefore',
      true
    )}${constructExtraFilters()}`;
    router.push(url);
  };

  const constructExtraFilters = () => {
    let url = '';
    for (const filter of extraFilters) {
      if (filter.filter && filter.value)
        url += getUrl(filter.value, filter.filter);
    }
    return url;
  };

  const getUrl = (value, term, isDate = false) => {
    if (value) {
      if (!isDate) return `${term}=<${encodeURIComponent(value)}>&`;
      return `${term}=${encodeURIComponent(value.toISOString().slice(0, 10))}&`;
    }
    return '';
  };

  return (
    <TopLevel doNotTrack={true} hideFooter={true} publicPage={true}>
      <div className={styles.container}>
        <SearchHeader selected="Advanced Search" />
        <div className={styles.standardcontainer}>
          <div className={styles.body}>
            <Options
              setCreator={setCreator}
              setObjectType={setObjectType}
              setSbolType={setSbolType}
              setRole={setRole}
              setCollections={setCollections}
              keyword={keyword}
              setKeyword={setKeyword}
              created={created}
              setCreated={setCreated}
              modified={modifed}
              setModified={setModified}
              extraFilters={extraFilters}
              setExtraFilters={setExtraFilters}
            />

            <div
              className={styles.searchbutton}
              role="button"
              onClick={() => {
                constructSearch();
              }}
            >
              <FontAwesomeIcon
                icon={faHatWizard}
                size="1x"
                className={styles.dnaicon}
                color="#F2E86D"
              />
              <div>Search</div>
            </div>
          </div>
        </div>
      </div>
    </TopLevel>
  );
}
