import Head from 'next/head'
import Navbar from './Navbar'
import Footer from './Footer'
import SearchPanel from './SearchPanel'

import styles from '../styles/layout.module.css'

export default function TopLevel(props) {
   return (
      <div>
         <Head>
            <title>SynBioHub</title>
            <link rel="icon" href="/favicon.ico" />
         </Head>
         <Navbar />
         <div className={styles.container}>
            {props.children}
            <SearchPanel />
         </div>
         <Footer />
      </div>
   )
}