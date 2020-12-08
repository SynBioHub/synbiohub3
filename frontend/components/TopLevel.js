import Head from 'next/head'
import Navbar from './Navbar'
import Footer from './Footer'
import SearchPanel from './SearchPanel'

import styles from '../styles/layout.module.css'
import { useState } from 'react'

export default function TopLevel(props)
{
   const [searching, setSearching] = useState(false);
   const [query, setQuery] = useState("");
   return (
      <div>
         <Head>
            <title>SynBioHub</title>
            <link rel="icon" href="/favicon.ico" />
         </Head>
         <Navbar searching={searching} setSearching={setSearching} query={query} setQuery={setQuery} />
         <div className={styles.container}>
            {props.searchingComponent ? <props.searchingComponent setSearching={setSearching}/> : props.children}
            {searching ? <SearchPanel query={query} /> : null}
         </div>
         <Footer />
      </div>
   )
}