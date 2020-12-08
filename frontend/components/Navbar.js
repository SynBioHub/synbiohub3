import Link from 'next/link'

import Selector from './NavbarComponents/Selector'

import styles from '../styles/navbar.module.css'
import SearchBar from './NavbarComponents/SearchBar';

export default function Navbar(props) {
   if(!props.searching) {
      return (
         <header className={styles.container}>
            <Link href="/">
               <img
                  src="/images/logo_uploaded.svg"
                  className={styles.logo}
                  alt="logo"
               />
            </Link>
            <div className={styles.navcontainer}>
               <nav className={styles.nav}>
                  <Selector name='Submit' icon="/images/submit_white.svg" />
                  <Selector name={'Shared With Me'} icon="/images/shared.svg" />
                  <Selector name={'Submissions'} icon="/images/submissions_white.svg"/>
               </nav>
               <img
                  src="/images/search.svg"
                  className={styles.searchicon}
                  onClick={() => {
                     props.setSearching(true);
                  }}
               />
               <img
                  src="/images/face.jpeg"
                  className={styles.borderCircle}
               />
            </div>
         </header>
      );
   }
   else {
      return (
         <header className={styles.container}>
            <div className={styles.searchcontainer}>
               <img
                  src="/images/search.svg"
                  className={styles.searchiconactive}
               />
               <SearchBar setQuery={props.setQuery} query={props.query} />
               <div className={styles.cancelsearch}
               onClick={() => {
                  props.setSearching(false);
               }}
               >{"\u2573"}</div>
            </div>
         </header>
      );
   }
}