import styles from '../../styles/admin.module.css';
import { useState, useEffect } from 'react';
import ActionButton from './Reusable/ActionButton';


export default function Explorer() {
    const [checked, setChecked] = useState(false);
    const [USchecked, setUSChecked] = useState(false);
    const [VSchecked, setVSChecked] = useState(false);
    const [startIndex, setStartIndex] = useState(0);
    const [endIndex, setEndIndex] = useState(0);
    const [autoUpdate, setAutoUpdate] = useState(false);
    const [days, setDays] = useState();
    const [distrib, setDistrib] = useState(false);
    const [tolerance, setTolerance] = useState(0.0002);
    const [clusterIdentity, setClusterIdentity] = useState(0.9);
    const [elasticSearchEnd, setElasticSearchEnd] = useState("http://elasticsearch:9200/");
    const [elasticSearchIndex, setElasticSearchIndex] = useState("part");
    const [sparqlEndpoint, setSparqlEndpoint] = useState("http://virtuoso:8890/sparql?");

    const handleChange = () => {
      setChecked(!checked);
    };
    const handleUSChange = () => {
        setUSChecked(!USchecked);
        setVSChecked(false);
      };
    const handleVSChange = () => {
        setVSChecked(!VSchecked);
        setUSChecked(false);
    };
    const handleUpdateIndex = () => {
        console.log("update1");
    }
    const handleDownloadLog = () => {
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
    const handleSubmit = () => {
        console.log("Submit");
    }

    useEffect(() => {

    }, []);
    return ( 
        <div>
            <div className="row">
            {!checked && <span>SBOLExplorer is disabled. Check the "Searching Using SBOLExplorer" to enable it.</span>} 
            {checked && <span>Note: Looks like SBOLExplorer is up and running :) Endpoint fields should end with '/', SynBioHub Public Graph should end with '/public', and SPARQL/Virtuoso Endpoint should end with '/sparql?'.</span>} 
            </div>
            <div className="row">
                <label >SBOLExplorer Endpoint</label>
                <input value="http://explorer:13162/" />
                <div>
                    <input
                    type="checkbox"
                    checked={checked}
                    onChange={handleChange}
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
                        onChange={handleUSChange}/>
                        USearch &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;

                        <input
                        type="radio"
                        checked={VSchecked}
                        onChange={handleVSChange}/>
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
                            action="Download Log"
                            color="#00A1E4"
                            onClick={handleDownloadLog}
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
                        />
                        Update index automatically
                    </div>

                    <div className="form-group">
                    Update index every &nbsp;
                    <input 
                        id="typeinp" 
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
                        />
                        Use Distributed Search
                    </div>
                </div>
            </div>
            <div className="form-group">
                Pagerank Tolerance &nbsp;
                <input 
                    id="typeinp" 
                    type="text" 
                    value={tolerance} 
                    onChange={handleTolerance}/>
            </div>
            <div className="form-group">
            UClust Clustering Identity &nbsp;
                <input 
                    id="typeinp" 
                    type="text" 
                    value={clusterIdentity} 
                    onChange={handleClusteringIdentity}/>
            </div>

            <div className="form-group">
            Elasticsearch Endpoint &nbsp;
                <input 
                    id="typeinp" 
                    type="text" 
                    value={elasticSearchEnd} 
                    onChange={handleElasticSearchEnd}/>
            </div>

            <div className="form-group">
            Elasticsearch Index Name &nbsp;
                <input 
                    id="typeinp" 
                    type="text" 
                    value={elasticSearchIndex} 
                    onChange={handleElasticSearchIndex}/>
            </div>

            <div className="form-group">
            SPARQL/Virtuoso Endpoint &nbsp;
                <input 
                    id="typeinp" 
                    type="text" 
                    value={sparqlEndpoint} 
                    onChange={handleSparqlEndpoint}/>
            </div>
            <div className={styles.actionbuttonslayout}>
                            <ActionButton
                            action="Save"
                            color="#00A1E4"
                            onClick={handleSubmit}
                            />
            </div>

                </div>
                )}
            </div>}
        </div>
);
  }


