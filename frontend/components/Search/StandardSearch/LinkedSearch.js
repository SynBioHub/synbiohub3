import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SearchHeader from '../SearchHeader/SearchHeader';
import ResultTable from './ResultTable/ResultTable';
import styles from '../../../styles/view.module.css';
import TopLevel from '../../TopLevel';
import NavbarSearch from '../NavbarSearch/NavbarSearch';

export default function search(properties) {
    const [Data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get(`${properties.url}`, {
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
                "Accept": "application/json"
            }
        })
            .then(response => {
                setData(response.data);
            })
            .catch(error => {
                console.error('Error fetching twins: ', error);
                setError(error);
            });
    }, []);

    if (error) {
        return <div>Error loading searched data.</div>;
    }

    if (!Data) {
        return <div>Loading...</div>;
    }

    return (
        <TopLevel
            doNotTrack={true}
            navbar={
                <NavbarSearch
                    value={properties.uri}
                    placeholder="Search SynBioHub"
                    onChange={event => {
                        dispatch(setSearchQuery(event.target.value));
                        dispatch(setOffset(0));
                    }}
                />
            }
            hideFooter={true}
            publicPage={true}
        >
            <div className={styles.searchContent}>
                <SearchHeader selected="Standard Search" />
                <ResultTable count={Data.length} data={Data} />
            </div>
        </TopLevel>

    );
}
