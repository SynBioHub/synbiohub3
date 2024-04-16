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
                        <label>
                            <input checked="" name="useDistributedSearch" type="checkbox" />
                            Use Distributed Search
                        </label>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-md-12">
                    <div className="form-group">
                        <label htmlFor="pagerankTolerance">Pagerank Tolerance</label>
                        <input className="form-control" name="pagerankTolerance" type="text" value=".0002" />
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-md-12">
                    <div className="form-group">
                        <label htmlFor="uclustIdentity">UClust Clustering Identity</label>
                        <input className="form-control" name="uclustIdentity" type="text" value="0.9" />
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-md-6">
                    <div className="form-group">
                        <label htmlFor="elasticsearchEndpoint">Elasticsearch Endpoint</label>
                        <input className="form-control" name="elasticsearchEndpoint" type="text" value="http://elasticsearch:9200/" />
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="form-group">
                        <label htmlFor="elasticsearchIndexName">Elasticsearch Index Name</label>
                        <input className="form-control" name="elasticsearchIndexName" type="text" value="part" />
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-md-12">
                    <div className="form-group">
                        <label htmlFor="sparqlEndpoint">SPARQL/Virtuoso Endpoint</label>
                        <input className="form-control" name="sparqlEndpoint" type="text" value="http://virtuoso:8890/sparql?" />
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-md-1 col-md-offset-11">
                    <button className="btn btn-primary" type="submit">Save</button>
                </div>
            </div>
                </div>
                )}
            </div>}
        </div>
);
  }


