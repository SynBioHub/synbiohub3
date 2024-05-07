import axios from 'axios';
import getConfig from 'next/config';
import styles from '../../styles/admin.module.css';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';
import ActionButton from './Reusable/ActionButton';
import { forEach } from 'jszip';
const { publicRuntimeConfig } = getConfig();


export default function Explorer() {
    const token = useSelector(state => state.user.token);
    const dispatch = useDispatch();
    const { config, loading } = useConfig(token, dispatch);
    const [checked, setChecked] = useState(false);
    const [USchecked, setUSChecked] = useState();
    const [VSchecked, setVSChecked] = useState();
    const [startIndex, setStartIndex] = useState();
    const [endIndex, setEndIndex] = useState();
    const [autoUpdate, setAutoUpdate] = useState();
    const [days, setDays] = useState();
    const [distrib, setDistrib] = useState();
    const [tolerance, setTolerance] = useState();
    const [clusterIdentity, setClusterIdentity] = useState();
    const [elasticSearchEnd, setElasticSearchEnd] = useState();
    const [elasticSearchIndex, setElasticSearchIndex] = useState();
    const [sparqlEndpoint, setSparqlEndpoint] = useState();

    const handleChange = () => {
      setChecked(!checked); // TODO
    };
    const handleUSChange = () => {
        setUSChecked(!USchecked);
        setVSChecked(false);
      };
    const handleVSChange = () => {
        setVSChecked(!VSchecked);
        setUSChecked(false);
    };
    const handleUpdateIndex = () => { // TODO
        console.log("update1");
    }
    const handleDownloadGeneralLog = () => { // TODO
        console.log("download1");
    }
    const handleDownloadIndexLog = () => { // TODO
        console.log("update2");
    } 
    const handleAutoUpdate = () => {
        setAutoUpdate(!autoUpdate);
    }
    const handleDays = () => {
        setAutoUpdate(days);
    }
    const handleDistrib = () => {
        setDistrib(!distrib);
    }
    const handleTolerance = () => {
        setTolerance(tolerance);
    }
    const handleClusteringIdentity = () => {
        setClusterIdentity(clusterIdentity);
    }
    const handleElasticSearchEnd = () => {
        setElasticSearchEnd(elasticSearchEnd);
    }
    const handleElasticSearchIndex = () => {
        setElasticSearchIndex(elasticSearchIndex);
    }
    const handleSparqlEndpoint = () => {
        setSparqlEndpoint(sparqlEndpoint);
    }
    const handleSubmit = () => { // TODO
        console.log("Submit: ");
    }

    useEffect(() => {
        if(config) {
            const configArr = Object.entries(config)?.map(([key, value]) => {
                return {key, value};
            })
            console.log("Array: ", configArr);
            for (let obj of configArr) {
                let key = obj.key;
                let value = obj.value;
                if (key === 'autoUpdateIndex') { // 1
                    setAutoUpdate(value);
                 } else if (key === 'distributed_search') { // 2
                   setDistrib(value);
                 } else if (key === 'elasticsearch_endpoint') { // 3
                    setElasticSearchEnd(value);
                 } else if (key === 'elasticsearch_index_name') { // 4
                    setElasticSearchIndex(value);
                 } else if (key === 'last_update_end') { // 5
                    setEndIndex(value);
                 } else if (key === 'last_update_start') { // 6
                    setStartIndex(value);
                 } else if (key === 'pagerank_tolerance') { // 7
                    setTolerance(value);
                 } else if (key === 'sparql_endpoint') { // 8
                    setSparqlEndpoint(value);
                 } else if (key === 'uclust_identity') { // 9
                    setClusterIdentity(value);
                 } else if (key === 'updateTimeInDays') { // 10
                    setDays(value);
                 } else if (key === 'which_search') { // 11
                    setVSChecked(value === 'vsearch');
                    setUSChecked(value === 'usearch');
                 }
            }
        }  
    }, [config]);

    return ( 
        <div>
            <div className="row">
            {!checked && <span>SBOLExplorer is disabled. Check the "Searching Using SBOLExplorer" to enable it.</span>} 
            {checked && <span>Note: Looks like SBOLExplorer is up and running :) Endpoint fields should end with '/', SynBioHub Public Graph should end with '/public', and SPARQL/Virtuoso Endpoint should end with '/sparql?'.</span>} 
            </div>
            <div className="row">
                <label >SBOLExplorer Endpoint
                    <input value="http://explorer:13162/" id="7"/>
                </label>
                
                <div>
                    <input
                    type="checkbox"
                    checked={checked}
                    onChange={handleChange}
                    id="8"
                    />
                    Searching Using SBOLExplorer
                </div>
            </div>
            {<div>
                {checked && 
                (<div>
                    <label>
                        <input
                        type="radio"
                        checked={USchecked}
                        onChange={handleUSChange}
                        id="9"/>
                        USearch &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;

                        <input
                        type="radio"
                        checked={VSchecked}
                        onChange={handleVSChange}
                        id="10"/>
                        VSearch
                    </label>
                    <div className={styles.actionbuttonscontainer}>
                        <div className={styles.actionbuttonslayout}>
                            <ActionButton
                            action="Update Index Now"
                            color="#00A1E4"
                            onClick={handleUpdateIndex}
                            />
                        </div>
                        <div className={styles.actionbuttonslayout}>
                            <ActionButton
                            action="Download General Log"
                            color="#00A1E4"
                            onClick={handleDownloadGeneralLog}
                            />
                        </div>
                        <div className={styles.actionbuttonslayout}>
                            <ActionButton
                            action="Download Index Log"
                            color="#00A1E4"
                            onClick={handleDownloadIndexLog}
                            />
                        </div>
                    </div>
            <div>
                <span>Start of last index update: {startIndex}<br />End of last index update: {endIndex}</span>
            </div>
            <div className="row">
                <div className="col-md-6">

                    <div>
                        <input
                        type="checkbox"
                        checked={autoUpdate}
                        onChange={handleAutoUpdate}
                        id="12"
                        />
                        Update index automatically
                    </div>

                    <div className="form-group">
                    Update index every &nbsp;
                    <input 
                        id="1" 
                        type="number" 
                        min="0" max="5" 
                        value={days} 
                        onChange={handleDays}
                        step="1"/> days
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-md-12">
                    <div className="checkbox">
                        <input
                        type="checkbox"
                        checked={distrib}
                        onChange={handleDistrib}
                        id="11"
                        />
                        Use Distributed Search
                    </div>
                </div>
            </div>
            <div className="form-group">
                Pagerank Tolerance &nbsp;
                <input 
                    id="2" 
                    type="text" 
                    value={tolerance} 
                    onChange={handleTolerance}/>
            </div>
            <div className="form-group">
            UClust Clustering Identity &nbsp;
                <input 
                    id="3" 
                    type="text" 
                    value={clusterIdentity} 
                    onChange={handleClusteringIdentity}/>
            </div>

            <div className="form-group">
            Elasticsearch Endpoint &nbsp;
                <input 
                    id="4" 
                    type="text" 
                    value={elasticSearchEnd} 
                    onChange={handleElasticSearchEnd}/>
            </div>

            <div className="form-group">
            Elasticsearch Index Name &nbsp;
                <input 
                    id="5" 
                    type="text" 
                    value={elasticSearchIndex} 
                    onChange={handleElasticSearchIndex}/>
            </div>

            <div className="form-group">
            SPARQL/Virtuoso Endpoint &nbsp;
                <input 
                    id="6" 
                    type="text" 
                    value={sparqlEndpoint} 
                    onChange={handleSparqlEndpoint}/>
            </div>
            <div className={styles.actionbuttonscontainer}>
                <div className={styles.actionbuttonslayout}>
                                <ActionButton
                                action="Save"
                                color="#00A1E4"
                                onClick={handleSubmit}
                                />
                </div>
            </div>

                </div>
                )}
            </div>}
        </div>
);
}

const fetcher = (url, token, dispatch) =>
        axios
            .get(url, {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/plain',
                'X-authorization': token
            }
            })
            .then(response => response.data)
            .catch(error => {
            error.customMessage = 'Error loading explorer config';
            error.fullUrl = url;
            dispatch(addError(error));
        });

const useConfig = (token, dispatch) => {
    const { data, error } = useSWR(
        [`${publicRuntimeConfig.backend}/admin/explorer`, token, dispatch],
        fetcher
    );
    return {
        config: data,
        loading: !error && !data
    };
};


