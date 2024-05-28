import axios from 'axios';
import getConfig from 'next/config';
import styles from '../../styles/admin.module.css';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSWR from 'swr';
import ActionButton from './Reusable/ActionButton';
const { publicRuntimeConfig } = getConfig();

export default function Explorer() {
    const token = useSelector(state => state.user.token);
    const dispatch = useDispatch();
    const { config, loading, isValidating } = useConfig(token, dispatch);
    const [checked, setChecked] = useState();
    const [SBOLEnd, setSBOLEnd] = useState();
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

    const handleUSChange = () => {
        setUSChecked(true);
        setVSChecked(false);
        console.log("USchecked: ", USchecked);
        console.log("VSchecked: ", VSchecked);
      };
    const handleVSChange = () => {
        setVSChecked(true);
        setUSChecked(false);
        console.log("USchecked: ", USchecked);
        console.log("VSchecked: ", VSchecked);
    };

    //Update SBOLExplorer Index
    const handleUpdateIndex = async () => {
        const params = new URLSearchParams();
        const url = `${publicRuntimeConfig.backend}/admin/explorerUpdateIndex`;
        const response = await axios
        .post(url, params, {
        headers: {
            'Accept': 'text/plain', 
            'X-authorization': token
        }
        })
        .then(response => response.data)
        .catch (error => {
        console.error('Error with updating index: ', error);
        error.customMessage = 'Error with updating index';
        error.fullUrl = url;
        });
    };

    //View SBOLExplorer Log
    const handleDownloadGeneralLog = async () => { // TODO
        const url = `${publicRuntimeConfig.backend}/admin/explorerlog`;
        console.log('GeneralLogURL: ', url);
        const res = await axios
            .get(url, {
                headers: {
                    Accept: 'text/plain',
                    'X-authorization': token
                },
                responseType: 'blob'  // This ensures the response is treated as a binary large object (blob)
            })
            .then(response => {
                const link = document.createElement('a');
                const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
                link.href = blobUrl;
                link.setAttribute('download', 'explorer_log.txt');  // Specify the file name
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(error => {
                // Handle errors here
                error.customMessage = 'Error with view general log';
                error.fullUrl = url;
                console.error(error);
            });
    }

    //admin/explorerIndexingLog
    const handleDownloadIndexLog = async () => { 
        const url = `${publicRuntimeConfig.backend}/admin/explorerIndexingLog`;
        console.log('url: ', url);
        const res = await axios
            .get(url, {
                headers: {
                    Accept: 'text/plain',
                    'X-authorization': token
                },
                responseType: 'blob' 
            })
            .then(response => {
                const link = document.createElement('a');
                const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
                link.href = blobUrl;
                link.setAttribute('download', 'explorer_indexing_log.txt');  // Specify the file name
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                console.log("download: ", response.data);
            })
            .catch(error => {
                error.customMessage = 'Error with view indexing log';
                error.fullUrl = url;
                console.error(error);
            });
    } 

    const handleUseSBOLExplorer = () => {
        setChecked(!checked);
    }
    const handleAutoUpdate = () => {
        setAutoUpdate(!autoUpdate);
    }
    const handleDistrib = () => {
        setDistrib(!distrib);
    }
    // question key is different from get 
    // Update SBOLExplorer Config
    const handleSubmit = async (checked, SBOLEnd, distrib, tolerance, clusterIdentity, 
        elasticSearchEnd, elasticSearchIndex, sparqlEndpoint, autoUpdate, days, USchecked) => {
        //const params = new URLSearchParams();
        const params = {
            'useSBOLExplorer': checked, // boolean value
            'SBOLExplorerEndpoint': SBOLEnd, 
            "SBOLExplorerConfig": {
                'useDistributedSearch': distrib,
                'pagerankTolerance': tolerance,
                'uclustIdentity': clusterIdentity,
                'elasticsearchEndpont': elasticSearchEnd,
                'elasticsearchIndexName': elasticSearchIndex,
                'spraqlEndpoint': sparqlEndpoint,
                'useCron': autoUpdate,
                'cronDay': days,
                'whichSearch': USchecked ? 'usearch' : 'vsearch'
            }
            
        };

        const url = `${publicRuntimeConfig.backend}/admin/explorer`;
        let res = await axios
        .post(url, params, {
        headers: {
            'Accept': 'text/plain',
            'X-authorization': token
        }
        })
        .then(response => response.data)
        .catch (error => {
        console.error('Error with submitting parameters: ', error);
        error.customMessage = 'Error with submitting parameters';
        error.fullUrl = url;
        });
        console.log("Submit Message: ", res);
        //console.log("Iterate each params key and value", Object.fromEntries(params));
    }

    useEffect(() => {
        // TODO: get "useSBOLExplorer" and "SBOLEnd"
        if(config) {
            console.log("SBOLExplorer Started");
            // get all key and value from config.json in SBOLExplorer
            const configArr = Object.entries(config)?.map(([key, value]) => {
                return {key, value};
            })
            console.log("Array: ", configArr);
            for (let obj of configArr) {
                let key = obj.key;
                let value = obj.value;
                if (key === 'SBOLExplorerEndpoint') {
                    setSBOLEnd(value);
                } else if (key === 'useSBOLExplorer') {
                    setChecked(value);
                } else if (key === 'SBOLExplorerConfig'){
                    console.log("here: ", value);
                    const configArr2 = Object.entries(value)?.map(([key, value]) => {
                        return {key, value};
                    })
                    for (let obj of configArr2) {
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
                            } else if (key === 'last_update_end') { // 
                            setEndIndex(value);
                            } else if (key === 'last_update_start') { // 
                            setStartIndex(value);
                            } else if (key === 'pagerank_tolerance') { // 5
                            setTolerance(value);
                            } else if (key === 'sparql_endpoint') { // 6
                            setSparqlEndpoint(value);
                            } else if (key === 'uclust_identity') { // 7
                            setClusterIdentity(value);
                            } else if (key === 'updateTimeInDays') { // 8
                            setDays(value);
                            } else if (key === 'which_search') { // 9
                            setVSChecked(value === 'vsearch');
                            setUSChecked(value === 'usearch');
                            } 
                    }
                }
                
                }
            } 
        }, [config]); 

    return ( 
        // logic: checked == true && SBOLEnd != empty, save, show parameter options
        <div>
            <div className="row">
            {!checked && <span>SBOLExplorer is disabled. Check the "Searching Using SBOLExplorer" to enable it.</span>} 
            {checked && SBOLEnd && <span>Note: Looks like SBOLExplorer is up and running :) Endpoint fields should end with '/', SynBioHub Public Graph should end with '/public', and SPARQL/Virtuoso Endpoint should end with '/sparql?'.</span>} 
            </div>
            <div className="row">
                <label >SBOLExplorer Endpoint
                    <input 
                        type="text" 
                        value={SBOLEnd} 
                        onChange={e => setSBOLEnd(e.target.value)} 
                        id="7"/>
                </label>
                
                <div>
                    <input
                    type="checkbox"
                    checked={checked}
                    onChange={handleUseSBOLExplorer}
                    id="8"
                    />
                    Searching Using SBOLExplorer
                </div>
            </div>
            {<div>
                {checked && SBOLEnd &&
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
                        min="0" max="100" 
                        value={days}
                        onChange={e => setDays(e.target.value)}
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
                    onChange={e => {setTolerance(e.target.value);
                    console.log("tolerance: ", e.target.value)}}/>
            </div>
            <div className="form-group">
            UClust Clustering Identity &nbsp;
                <input 
                    id="3" 
                    type="text" 
                    value={clusterIdentity} 
                    onChange={e => {
                        setClusterIdentity(e.target.value);
                        console.log("clusterIdentity: ", e.target.value);
                        }}/>
            </div>

            <div className="form-group">
            Elasticsearch Endpoint &nbsp;
                <input 
                    id="4" 
                    type="text" 
                    value={elasticSearchEnd} 
                    onChange={e => setElasticSearchEnd(e.target.value)}/>
            </div>

            <div className="form-group">
            Elasticsearch Index Name &nbsp;
                <input 
                    id="5" 
                    type="text" 
                    value={elasticSearchIndex} 
                    onChange={e => {setElasticSearchIndex(e.target.value);
                    console.log("elasticSearchIndex: ", e.target.value)}}/>
            </div>

            <div className="form-group">
            SPARQL/Virtuoso Endpoint &nbsp;
                <input 
                    id="6" 
                    type="text" 
                    value={sparqlEndpoint} 
                    onChange={e => setSparqlEndpoint(e.target.value)}/>
            </div>
            
        </div>
                )}
                <div className={styles.actionbuttonscontainer}>
                <div className={styles.actionbuttonslayout}>
                                <ActionButton
                                action="Save"
                                color="#00A1E4"
                                onClick={()=>handleSubmit(checked, SBOLEnd, distrib, tolerance, clusterIdentity, 
                                    elasticSearchEnd, elasticSearchIndex, sparqlEndpoint, autoUpdate, days, USchecked)} // Error
                                />
                </div>
            </div>
            </div>}
        </div>
);
}
// if SBOLExplorer is on
const useConfig = (token, dispatch) => {
    const { data, error } = useSWR(
      [`${publicRuntimeConfig.backend}/admin/explorer`, token, dispatch],
      fetcher
    );
    console.log("Config only on: ", data);
    return {
      config: data,
      loading: !error && !data,
      error: error
    };
  };
  
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
        error.customMessage = 'Error loading graphs';
        error.fullUrl = url;
        dispatch(addError(error));
      });
