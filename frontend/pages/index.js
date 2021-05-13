import TopLevel from '../components/TopLevel';
import Card from '../components/HomeComponents/Card';

import styles from '../styles/home.module.css';

function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to
          {' '}
          <a
            href="https://synbiohub.github.io/api-docs/#about-synbiohub"
            rel="noreferrer"
            target="_blank"
          >
            SynBioHub
          </a>
        </h1>

        <p className={styles.description}>
          SynBioHub is a design repository for people designing biological constructs.
          It enables DNA and protein designs to be uploaded, then provides a shareable link to allow others to view them.
          SynBioHub also facilitates searching for information about existing useful parts and designs by combining data from a variety of sources.
        </p>

        <div className={styles.grid}>
          <Card
            description="Browse SynBioHub for useful parts and designs"
            icon="/images/search_black.svg"
            title="Search"
          />

          <Card
            description="Upload your parts and designs for safekeeping"
            icon="/images/submit.svg"
            iconheight="1.5rem"
            iconoffset="-20%"
            iconright="0.75rem"
            title="Submit A Design"
          />

          <Card
            description="Prepare designs for publication or collaboration"
            icon="/images/submissions.svg"
            iconheight="1.7rem"
            iconoffset="-35%"
            iconright="0.75rem"
            title="Manage Submissions"
          />

          <Card
            description="View parts and designs that have been shared with me"
            icon="/images/shared_black.svg"
            iconheight="1.6rem"
            iconoffset="-33%"
            iconright="0.6rem"
            title="Collaborate"
          />
        </div>
      </main>
    </div>
  );
}

export default function HomeWithProps() {
  return <TopLevel><Home /></TopLevel>;
}
