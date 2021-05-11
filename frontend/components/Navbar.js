import Link from 'next/link'

import Selector from './NavbarComponents/Selector'
import SearchBar from './NavbarComponents/SearchBar'
import { useDispatch, useSelector } from 'react-redux'
import { setSearchingActive } from '../redux/actions'

import styles from '../styles/navbar.module.css'

export default function Navbar() {
   const searchingOpen = useSelector(state => state.search.active);
   const dispatch = useDispatch();

   if(!searchingOpen) {
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
                  onClick={() => dispatch(setSearchingActive(true))}
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
      return <NavInSearchMode />;
   }
}

function NavInSearchMode() {
   const dispatch = useDispatch();
   return (
      <header className={styles.container}>
         <div className={styles.searchcontainer}>
            <img
               src="/images/search.svg"
               className={styles.searchiconactive}
            />
            <SearchBar />
            <div className={styles.cancelsearch}
            onClick={() => dispatch(setSearchingActive(false))}
            >{"\u2573"}</div>
         </div>
      </header>
   );
}