import {
  faAlignLeft,
  faAlignRight,
  faBars,
  faCalendarPlus,
  faCloudDownloadAlt,
  faHardHat,
  faImage,
  faLock,
  faMinusSquare,
  faPlug,
  faPuzzlePiece,
  faQuoteRight,
  faRunning,
  faShareSquare,
  faStickyNote,
  faTrashAlt,
  faUserEdit,
  faUserPlus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import useSWR from 'swr';
const { publicRuntimeConfig } = getConfig();

import Loading from '../components/Reusable/Loading';
import TopLevel from '../components/TopLevel';
import styles from '../styles/view.module.css';

function View() {
  const router = useRouter();
  const { view } = router.query;
  const token = useSelector(state => state.user.token);
  const url = view ? view.join('/') : '';
  const { results, isLoading, isError } = useURI(url, token);

  if (!url || isLoading) {
    return <Loading />;
  } else if (isError || results.length === 0) {
    return <div>Page not found</div>;
  }
  const data = results[0];
  return (
    <div className={styles.container}>
      <div className={styles.sidepanel}>
        <div className={styles.headercontainer}>
          <h2 className={styles.title}>{data.name}</h2>
          <div className={styles.metaicons}>
            <FontAwesomeIcon
              icon={faLock}
              size="1x"
              className={styles.metaicon}
            />
            <FontAwesomeIcon
              icon={faPuzzlePiece}
              size="1x"
              className={styles.metaicon}
            />
          </div>
          <div className={styles.panelbutton}>
            <FontAwesomeIcon icon={faBars} size="1x" />
          </div>
        </div>
        <div className={styles.subheader}>
          <h3 className={styles.id}>{data.displayId}</h3>
          <div className={styles.actionicons}>
            <FontAwesomeIcon
              icon={faShareSquare}
              size="1x"
              className={styles.actionicon}
            />
            <FontAwesomeIcon
              icon={faCloudDownloadAlt}
              size="1x"
              className={styles.actionicon}
            />
            <FontAwesomeIcon
              icon={faQuoteRight}
              size="1x"
              className={styles.actionicon}
            />
            <FontAwesomeIcon
              icon={faUserPlus}
              size="1x"
              className={styles.actionicon}
            />
            <FontAwesomeIcon
              icon={faTrashAlt}
              size="1x"
              className={styles.actionicon}
            />
          </div>
        </div>
        <div className={styles.infocontainer}>
          <Info icon={faHardHat} title="Terminator, Circular" />
          <Info
            icon={faQuoteRight}
            title="http://parts.igem.org/Part:BBa_E0240"
          />
          <Info icon={faUserEdit} title="Jennifer Braff" />
          <Info icon={faCalendarPlus} title="2004-10-17" />
          <Info icon={faRunning} title={data.persistentIdentity} />
        </div>
        <div className={styles.pagesections}>
          <h2 className={styles.pagesectionstitle}>Page Sections</h2>
          <SectionHeader title="VisBOL" icon={faImage} />
          <SectionHeader title="Description" icon={faAlignLeft} />
          <SectionHeader title="Sequence Visualization" icon={faPlug} />
          <SectionHeader title="Sequence Annotations" icon={faStickyNote} />
          <SectionHeader title="Other Properties" icon={faAlignRight} />
          <SectionHeader title="Download Options" icon={faCloudDownloadAlt} />
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.contentheader}>
          <h1 className={styles.maintitle}>
            <FontAwesomeIcon
              icon={faLock}
              size="1x"
              className={styles.contenttitleicon}
            />
            {data.name}
          </h1>
          <h1 className={styles.maintitleid}>({data.displayId})</h1>
        </div>
        <div className={styles.contentinfo}>
          <FontAwesomeIcon
            icon={faPuzzlePiece}
            size="1x"
            className={styles.contentinfoicon}
          />
          Component
        </div>
        <div className={styles.description}>{data.description}</div>
        <div className={styles.sections}>
          <Section title="VisBOL" />
          <Section title="Description" />
        </div>
      </div>
      <div></div>
    </div>
  );
}

function Section(properties) {
  return (
    <div className={styles.section}>
      <div className={styles.sectiontitle}>{properties.title}</div>
      <div className={styles.minimize}>
        <FontAwesomeIcon
          icon={faMinusSquare}
          size="1x"
          className={styles.sectionminimizeicon}
        />
      </div>
    </div>
  );
}

function SectionHeader(properties) {
  return (
    <div className={styles.sectionheader}>
      <div className={styles.titleandbox}>
        <input type="checkbox" />
        <div className={styles.sectionheadertitle}>{properties.title}</div>
      </div>
      <FontAwesomeIcon
        icon={properties.icon}
        size="1x"
        className={styles.sectionheadericon}
      />
    </div>
  );
}

function Info(properties) {
  return (
    <div className={styles.info}>
      <div className={styles.infoiconcontainer}>
        <FontAwesomeIcon
          icon={properties.icon}
          size="1x"
          className={styles.infoicon}
        />
      </div>
      <div className={styles.infotitle}>{properties.title}</div>
    </div>
  );
}

const useURI = (url, token) => {
  const { data, error } = useSWR(
    [`${publicRuntimeConfig.backend}/${url}/metadata`, token],
    fetcher
  );

  return {
    results: data,
    isLoading: !error && !data,
    isError: error
  };
};

const fetcher = (url, token) =>
  axios
    .get(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        'X-authorization': token
      }
    })
    .then(response => response.data);

export default function ViewWrapped() {
  return (
    <TopLevel publicPage={true}>
      <View />
    </TopLevel>
  );
}
