import React, { useEffect, useState } from 'react';
import Link from "next/link";

import getOwner from '../../../sparql/getOwner';
import getAttachments from "../../../sparql/getAttachments";
import getQueryResponse from '../../../sparql/tools/getQueryResponse';
import Loading from '../../Reusable/Loading';
import { useSelector } from 'react-redux';

import styles from '../../../styles/view.module.css';
import { faDownload, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * If the user is the creator of the collection then the upload/lookup attachment section
 * and the garbage icon next to any attachments is shown.
 * 
 * @param {Any} properties Information passed down from parent component.
 * @returns The attachments and optional upload/lookup attachment section.
 */
export default function Attachments(properties) {
  const [owner, setOwner] = useState();
  const [attachments, setAttachments] = useState();
  const graphUri = useSelector(state => state.user.graphUri);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (owner == undefined) {
      getQueryResponse(getOwner, { uri: properties.uri }).then(owner => {
        if (owner.length > 0) setOwner(owner);
        //Handles multiple owners.
        owner.map((res) => {
          if (res.ownedBy === graphUri) setIsOwner(true);
        });
      });
    }
  }, [owner]);

  useEffect(() => {
    if (attachments == undefined) {
      getQueryResponse(getAttachments, { uri: properties.uri }).then(attachments => {
        if (attachments.length > 0) setAttachments(attachments);
      });
    }
  }, [attachments]);

  if (!owner) return <Loading />;

  return (
    <div>
      <AttachmentsTable 
        attachments={attachments} 
        owner={isOwner} 
        uri={properties.uri} 
        headers={["Type", "Name", "Size"]} 
      />
    </div>
  );
}

/**
 * @param {Any} properties Information passed in from the parent component.
 * @returns The list of attachments and the uploading/lookup section if the user is the owner.
 */
function AttachmentsTable(properties) {
  const header = createHeader(properties.headers);
  const attachmentRows = getAttachmentRows(properties.attachments, properties.owner);

  if (properties.attachments === undefined && !properties.owner) {
    return <React.Fragment></React.Fragment>
  }

  return (
    <table className={styles.table}>
      {properties.headers && (
        <thead>
          <tr>{header}</tr>
        </thead>
      )}
      <tbody>
        {attachmentRows}
        {properties.owner && <UploadAttachments />}
      </tbody>
    </table>
  );
}

/**
 * @param {Array} headers An array of strings that are the headers that are to be generated.
 * @returns Table headers with the specified headers.
 */
function createHeader(headers) {
  return headers.map(header => {
    //Handles if the header is Size so the border-bottom will span the whole table.
    if(header === "Size") return <th colSpan = {3} key = {header}>{header}</th>
    
    return <th key={header}>{header}</th>
  });
}

/**
 * 
 * @param {Array} currentAttachments An array containing objects that have keys p and o 
 * that is information about the attachments.
 * @param {Boolean} owner If the current user is the owner.
 * @returns The rows the contains the information about the attachments.
 */
function getAttachmentRows(currentAttachments, owner) {
  if (currentAttachments !== undefined) {
    const attachmentValues = { type: [], name: [], size: [], link: [] };

    /**
     * @param {Number} bytes The number of bytes.
     * @returns The correct unit and formatted number of bytes.
     */
    const bytesToSize = (bytes) => {
      const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
      if (bytes == 0) return "0";
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
    }

    //Organizes the information from the query and groups the information in the correct order.
    currentAttachments.map(obj => {
      if (obj.p.endsWith("format")) attachmentValues.type.push(obj.o.split("/").pop());
      else if (obj.p.endsWith("size")) attachmentValues.size.push(bytesToSize(obj.o));
      else if (obj.p.endsWith("title")) attachmentValues.name.push(obj.o);
      else if (obj.p.endsWith("topLevel")) attachmentValues.link.push(obj.o);
    });

    return attachmentValues.type.map((element, key) => {
      return (
        <tr key={key}>
          <td>
            {element}
          </td>
          <td>
            <Link href={attachmentValues.link[key]}>
              <a className={styles.link}>
                {attachmentValues.name[key]}
              </a>
            </Link>
          </td>
          <td>
            {attachmentValues.size[key]}
          </td>
          <td className={styles.downloadbutton}>
            <div
              type="button"
              onClick={() => {
                console.log(2);
              }}
            >
              <FontAwesomeIcon
                icon={faDownload}
                size="1x"
                color="#465875"
                className={styles.downloadicon}
              />
              {" "}Download
            </div>
          </td>
          <td className={styles.removebutton}>
          {owner && 
            <div type="button">
                <FontAwesomeIcon
                  icon={faTrashAlt}
                  size="1x"
                  color="#465875"
                  className={styles.deleteicon}
                />
            </div>}
          </td>
        </tr>
      );
    });
  }
}

/**
 * @param {Any} properties Information passed in from parent component.
 * @returns A section where the owner can upload attachments or lookup attachments.
 */
function UploadAttachments(properties) {
  return (
    <React.Fragment>
      <tr>
        <td>
          <strong>Upload Attachment</strong>
        </td>
        <td className={styles.attachtd} colSpan={2}>
          <div className={styles.attachelements}>
            <input className={styles.fileattached} type="text" readOnly={true} />
            <label className={styles.selectfile}>
              Select file
              <input type="file"></input>
            </label>
          </div>
        </td>
        <td className={styles.attachtd} colSpan={2}>
          <div type="button" className={styles.attachbutton}>
            Attach
          </div>
        </td>
      </tr>
      <tr>
        <td>
          <strong>Lookup Attachment</strong>
        </td>
        <td colSpan={2}>
          <div className={styles.lookupurl}>
            <input className={styles.lookupinput} placeholder="URL" type="text" readOnly={false} />
          </div>
          <div className={styles.lookuprow}>
            <input className={styles.lookupinput} placeholder="Name" type="text" readOnly={false} />
            <select name="type">
              <option defaultValue={true}>
                Pick an attachment type...
              </option>
              <option value="http://edamontology.org/format_3010">
                .nib
              </option>
              <option value="http://edamontology.org/format_3009">
                2bit
              </option>
              <option value="http://edamontology.org/format_2064">
                3D-1D scoring matrix format
              </option>
              <option value="http://edamontology.org/format_3281">
                A2M
              </option>
              <option value="http://edamontology.org/format_1504">
                aaindex
              </option>
              <option value="http://edamontology.org/format_3000">
                AB1
              </option>
              <option value="http://edamontology.org/format_3708">
                ABCD format
              </option>
              <option value="http://edamontology.org/format_1628">
                ABI
              </option>
              <option value="http://edamontology.org/format_3001">
                ACE
              </option>
              <option value="http://edamontology.org/format_1923">
                acedb
              </option>
              <option value="http://edamontology.org/format_1639">
                affymetrix
              </option>
              <option value="http://edamontology.org/format_1641">
                affymetrix-exp
              </option>
              <option value="http://edamontology.org/format_3582">
                afg
              </option>
              <option value="http://edamontology.org/format_3693">
                AGP
              </option>
              <option value="http://edamontology.org/format_1921">
                Alignment format
              </option>
              <option value="http://edamontology.org/format_2920">
                Alignment format (pair only)
              </option>
              <option value="http://edamontology.org/format_2554">
                Alignment format (text)
              </option>
              <option value="http://edamontology.org/format_2555">
                Alignment format (XML)
              </option>
              <option value="http://edamontology.org/format_3888">
                AMBER frcmod
              </option>
              <option value="http://edamontology.org/format_3881">
                AMBER top
              </option>
              <option value="http://edamontology.org/format_2097">
                ambiguous
              </option>
              <option value="http://edamontology.org/format_2017">
                Amino acid index format
              </option>
              <option value="http://edamontology.org/format_3780">
                Annotated text format
              </option>
              <option value="http://edamontology.org/format_3830">
                ARB
              </option>
              <option value="http://edamontology.org/format_3581">
                arff
              </option>
              <option value="http://edamontology.org/format_2020">
                Article format
              </option>
              <option value="http://edamontology.org/format_1966">
                ASN.1 sequence format
              </option>
              <option value="http://edamontology.org/format_3013">
                axt
              </option>
              <option value="http://edamontology.org/format_3327">
                BAI
              </option>
              <option value="http://edamontology.org/format_2572">
                BAM
              </option>
              <option value="http://edamontology.org/format_3020">
                BCF
              </option>
              <option value="http://edamontology.org/format_3689">
                BCML
              </option>
              <option value="http://edamontology.org/format_3690">
                BDML
              </option>
              <option value="http://edamontology.org/format_3843">
                BEAST
              </option>
              <option value="http://edamontology.org/format_3003">
                BED
              </option>
              <option value="http://edamontology.org/format_3586">
                bed12
              </option>
              <option value="http://edamontology.org/format_3585">
                bed6
              </option>
              <option value="http://edamontology.org/format_3583">
                bedgraph
              </option>
              <option value="http://edamontology.org/format_3584">
                bedstrict
              </option>
              <option value="http://edamontology.org/format_3691">
                BEL
              </option>
              <option value="http://edamontology.org/format_3615">
                bgzip
              </option>
              <option value="http://edamontology.org/format_2848">
                Bibliographic reference format
              </option>
              <option value="http://edamontology.org/format_3004">
                bigBed
              </option>
              <option value="http://edamontology.org/format_3006">
                bigWig
              </option>
              <option value="http://edamontology.org/format_2333">
                Binary format
              </option>
              <option value="http://edamontology.org/format_3885">
                BinPos
              </option>
              <option value="http://edamontology.org/format_3782">
                BioC
              </option>
              <option value="http://edamontology.org/format_3706">
                Biodiversity data format
              </option>
              <option value="http://edamontology.org/format_3772">
                BioJSON (BioXSD)
              </option>
              <option value="http://edamontology.org/format_3774">
                BioJSON (Jalview)
              </option>
              <option value="http://edamontology.org/format_2013">
                Biological pathway or network format
              </option>
              <option value="http://edamontology.org/format_3166">
                Biological pathway or network report format
              </option>
              <option value="http://edamontology.org/format_3746">
                BIOM format
              </option>
              <option value="http://edamontology.org/format_3785">
                BioNLP Shared Task format
              </option>
              <option value="http://edamontology.org/format_3156">
                BioPAX
              </option>
              <option value="http://edamontology.org/format_2352">
                BioXSD (XML)
              </option>
              <option value="http://edamontology.org/format_3773">
                BioYAML
              </option>
              <option value="http://edamontology.org/format_1333">
                BLAST results
              </option>
              <option value="http://edamontology.org/format_3331">
                BLAST XML results format
              </option>
              <option value="http://edamontology.org/format_3836">
                BLAST XML v2 results format
              </option>
              <option value="http://edamontology.org/format_3313">
                BLC
              </option>
              <option value="http://edamontology.org/format_3592">
                BMP
              </option>
              <option value="http://edamontology.org/format_3909">
                BpForms
              </option>
              <option value="http://edamontology.org/format_3487">
                BSML
              </option>
              <option value="http://edamontology.org/format_3776">
                BTrack
              </option>
              <option value="http://edamontology.org/format_1630">
                CAF
              </option>
              <option value="http://edamontology.org/format_3100">
                CATH domain report format
              </option>
              <option value="http://edamontology.org/format_2184">
                cdsxml
              </option>
              <option value="http://edamontology.org/format_1638">
                cel
              </option>
              <option value="http://edamontology.org/format_3240">
                CellML
              </option>
              <option value="http://edamontology.org/format_3844">
                Chado-XML
              </option>
              <option value="http://edamontology.org/format_3887">
                CHARMM rtf
              </option>
              <option value="http://edamontology.org/format_2030">
                Chemical data format
              </option>
              <option value="http://edamontology.org/format_2035">
                Chemical formula format
              </option>
              <option value="http://edamontology.org/format_1644">
                CHP
              </option>
              <option value="http://edamontology.org/format_3587">
                chrominfo
              </option>
              <option value="http://edamontology.org/format_1737">
                CiteXplore-all
              </option>
              <option value="http://edamontology.org/format_1736">
                CiteXplore-core
              </option>
              <option value="http://edamontology.org/format_1424">
                ClustalW dendrogram
              </option>
              <option value="http://edamontology.org/format_1982">
                ClustalW format
              </option>
              <option value="http://edamontology.org/format_1925">
                codata
              </option>
              <option value="http://edamontology.org/format_3686">
                COMBINE OMEX
              </option>
              <option value="http://edamontology.org/format_2566">
                completely unambiguous
              </option>
              <option value="http://edamontology.org/format_2567">
                completely unambiguous pure
              </option>
              <option value="http://edamontology.org/format_2569">
                completely unambiguous pure dna
              </option>
              <option value="http://edamontology.org/format_2568">
                completely unambiguous pure nucleotide
              </option>
              <option value="http://edamontology.org/format_2607">
                completely unambiguous pure protein
              </option>
              <option value="http://edamontology.org/format_2570">
                completely unambiguous pure rna sequence
              </option>
              <option value="http://edamontology.org/format_1209">
                consensus
              </option>
              <option value="http://edamontology.org/format_3832">
                consensusXML
              </option>
              <option value="http://edamontology.org/format_3239">
                CopasiML
              </option>
              <option value="http://edamontology.org/format_3462">
                CRAM
              </option>
              <option value="http://edamontology.org/format_3589">
                csfasta
              </option>
              <option value="http://edamontology.org/format_3752">
                CSV
              </option>
              <option value="http://edamontology.org/format_3309">
                CT
              </option>
              <option value="http://edamontology.org/format_3588">
                customtrack
              </option>
              <option value="http://edamontology.org/format_3857">
                CWL
              </option>
              <option value="http://edamontology.org/format_3235">
                Cytoband format
              </option>
              <option value="http://edamontology.org/format_3477">
                Cytoscape input file format
              </option>
              <option value="http://edamontology.org/format_1393">
                daf
              </option>
              <option value="http://edamontology.org/format_1967">
                DAS format
              </option>
              <option value="http://edamontology.org/format_1968">
                dasdna
              </option>
              <option value="http://edamontology.org/format_1978">
                DASGFF
              </option>
              <option value="http://edamontology.org/format_1637">
                dat
              </option>
              <option value="http://edamontology.org/format_3326">
                Data index format
              </option>
              <option value="http://edamontology.org/format_2066">
                Database hits (sequence) format
              </option>
              <option value="http://edamontology.org/format_3729">
                dbGaP format
              </option>
              <option value="http://edamontology.org/format_1926">
                dbid
              </option>
              <option value="http://edamontology.org/format_1983">
                debug
              </option>
              <option value="http://edamontology.org/format_1979">
                debug-feat
              </option>
              <option value="http://edamontology.org/format_1969">
                debug-seq
              </option>
              <option value="http://edamontology.org/format_1336">
                dhf
              </option>
              <option value="http://edamontology.org/format_1392">
                DIALIGN format
              </option>
              <option value="http://edamontology.org/format_3548">
                DICOM format
              </option>
              <option value="http://edamontology.org/format_2074">
                Dirichlet distribution format
              </option>
              <option value="http://edamontology.org/format_1212">
                dna
              </option>
              <option value="http://edamontology.org/format_3507">
                Document format
              </option>
              <option value="http://edamontology.org/format_3506">
                docx
              </option>
              <option value="http://edamontology.org/format_1457">
                Dot-bracket format
              </option>
              <option value="http://edamontology.org/format_1454">
                dssp
              </option>
              <option value="http://edamontology.org/format_3751">
                DSV
              </option>
              <option value="http://edamontology.org/format_3652">
                dta
              </option>
              <option value="http://edamontology.org/format_3157">
                EBI Application Result XML
              </option>
              <option value="http://edamontology.org/format_3484">
                ebwt
              </option>
              <option value="http://edamontology.org/format_3491">
                ebwtl
              </option>
              <option value="http://edamontology.org/format_3818">
                ELAND format
              </option>
              <option value="http://edamontology.org/format_1248">
                EMBL feature location
              </option>
              <option value="http://edamontology.org/format_1927">
                EMBL format
              </option>
              <option value="http://edamontology.org/format_2204">
                EMBL format (XML)
              </option>
              <option value="http://edamontology.org/format_2311">
                EMBL-HTML
              </option>
              <option value="http://edamontology.org/format_2181">
                EMBL-like (text)
              </option>
              <option value="http://edamontology.org/format_2558">
                EMBL-like (XML)
              </option>
              <option value="http://edamontology.org/format_2543">
                EMBL-like format
              </option>
              <option value="http://edamontology.org/format_2183">
                EMBLXML
              </option>
              <option value="http://edamontology.org/format_1297">
                EMBOSS repeat
              </option>
              <option value="http://edamontology.org/format_1357">
                EMBOSS sequence pattern
              </option>
              <option value="http://edamontology.org/format_2001">
                EMBOSS simple format
              </option>
              <option value="http://edamontology.org/format_3614">
                ENCODE broad peak format
              </option>
              <option value="http://edamontology.org/format_3613">
                ENCODE narrow peak format
              </option>
              <option value="http://edamontology.org/format_3612">
                ENCODE peak format
              </option>
              <option value="http://edamontology.org/format_3499">
                Ensembl variation file format
              </option>
              <option value="http://edamontology.org/format_2027">
                Enzyme kinetics report format
              </option>
              <option value="http://edamontology.org/format_3466">
                EPS
              </option>
              <option value="http://edamontology.org/format_1316">
                est2genome format
              </option>
              <option value="http://edamontology.org/format_1631">
                EXP
              </option>
              <option value="http://edamontology.org/format_3167">
                Experiment annotation format
              </option>
              <option value="http://edamontology.org/format_1929">
                FASTA
              </option>
              <option value="http://edamontology.org/format_1332">
                FASTA search results format
              </option>
              <option value="http://edamontology.org/format_1984">
                FASTA-aln
              </option>
              <option value="http://edamontology.org/format_2310">
                FASTA-HTML
              </option>
              <option value="http://edamontology.org/format_2546">
                FASTA-like
              </option>
              <option value="http://edamontology.org/format_2200">
                FASTA-like (text)
              </option>
              <option value="http://edamontology.org/format_3823">
                FASTG
              </option>
              <option value="http://edamontology.org/format_1930">
                FASTQ
              </option>
              <option value="http://edamontology.org/format_1931">
                FASTQ-illumina
              </option>
              <option value="http://edamontology.org/format_2545">
                FASTQ-like format
              </option>
              <option value="http://edamontology.org/format_2182">
                FASTQ-like format (text)
              </option>
              <option value="http://edamontology.org/format_1932">
                FASTQ-sanger
              </option>
              <option value="http://edamontology.org/format_1933">
                FASTQ-solexa
              </option>
              <option value="http://edamontology.org/format_3833">
                featureXML
              </option>
              <option value="http://edamontology.org/format_1582">
                findkm
              </option>
              <option value="http://edamontology.org/format_1934">
                fitch program
              </option>
              <option value="http://edamontology.org/format_1915">
                Format
              </option>
              <option value="http://edamontology.org/format_2350">
                Format (by type of data)
              </option>
              <option value="http://edamontology.org/format_3163">
                GCDML
              </option>
              <option value="http://edamontology.org/format_1935">
                GCG
              </option>
              <option value="http://edamontology.org/format_3486">
                GCG format variant
              </option>
              <option value="http://edamontology.org/format_1947">
                GCG MSF
              </option>
              <option value="http://edamontology.org/format_3709">
                GCT/Res format
              </option>
              <option value="http://edamontology.org/format_3312">
                GDE
              </option>
              <option value="http://edamontology.org/format_3249">
                GelML
              </option>
              <option value="http://edamontology.org/format_3622">
                Gemini SQLite format
              </option>
              <option value="http://edamontology.org/format_3812">
                GEN
              </option>
              <option value="http://edamontology.org/format_1936">
                GenBank format
              </option>
              <option value="http://edamontology.org/format_2532">
                GenBank-HTML
              </option>
              <option value="http://edamontology.org/format_2559">
                GenBank-like format
              </option>
              <option value="http://edamontology.org/format_2205">
                GenBank-like format (text)
              </option>
              <option value="http://edamontology.org/format_2031">
                Gene annotation format
              </option>
              <option value="http://edamontology.org/format_2058">
                Gene expression report format
              </option>
              <option value="http://edamontology.org/format_3011">
                genePred
              </option>
              <option value="http://edamontology.org/format_2186">
                geneseq
              </option>
              <option value="http://edamontology.org/format_1937">
                genpept
              </option>
              <option value="http://edamontology.org/format_2305">
                GFF
              </option>
              <option value="http://edamontology.org/format_1974">
                GFF2
              </option>
              <option value="http://edamontology.org/format_1938">
                GFF2-seq
              </option>
              <option value="http://edamontology.org/format_1975">
                GFF3
              </option>
              <option value="http://edamontology.org/format_1939">
                GFF3-seq
              </option>
              <option value="http://edamontology.org/format_3467">
                GIF
              </option>
              <option value="http://edamontology.org/format_1940">
                giFASTA format
              </option>
              <option value="http://edamontology.org/format_3822">
                GML
              </option>
              <option value="http://edamontology.org/format_3657">
                GPML
              </option>
              <option value="http://edamontology.org/format_3829">
                GPR
              </option>
              <option value="http://edamontology.org/format_3617">
                Graph format
              </option>
              <option value="http://edamontology.org/format_3883">
                GROMACS itp
              </option>
              <option value="http://edamontology.org/format_3880">
                GROMACS top
              </option>
              <option value="http://edamontology.org/format_3775">
                GSuite
              </option>
              <option value="http://edamontology.org/format_2306">
                GTF
              </option>
              <option value="http://edamontology.org/format_3164">
                GTrack
              </option>
              <option value="http://edamontology.org/format_3019">
                GVF
              </option>
              <option value="http://edamontology.org/format_3873">
                HDF
              </option>
              <option value="http://edamontology.org/format_3590">
                HDF5
              </option>
              <option value="http://edamontology.org/format_1941">
                hennig86
              </option>
              <option value="http://edamontology.org/format_1705">
                HET group dictionary entry format
              </option>
              <option value="http://edamontology.org/format_2072">
                Hidden Markov model format
              </option>
              <option value="http://edamontology.org/format_2075">
                HMM emission and transition counts format
              </option>
              <option value="http://edamontology.org/format_1349">
                HMMER Dirichlet prior
              </option>
              <option value="http://edamontology.org/format_1351">
                HMMER emission and transition
              </option>
              <option value="http://edamontology.org/format_1370">
                HMMER format
              </option>
              <option value="http://edamontology.org/format_1422">
                HMMER profile alignment (HMM versus sequences)
              </option>
              <option value="http://edamontology.org/format_1421">
                HMMER profile alignment (sequences versus HMMs)
              </option>
              <option value="http://edamontology.org/format_1391">
                HMMER-aln
              </option>
              <option value="http://edamontology.org/format_3328">
                HMMER2
              </option>
              <option value="http://edamontology.org/format_3329">
                HMMER3
              </option>
              <option value="http://edamontology.org/format_3845">
                HSAML
              </option>
              <option value="http://edamontology.org/format_1455">
                hssp
              </option>
              <option value="http://edamontology.org/format_2331">
                HTML
              </option>
              <option value="http://edamontology.org/format_3839">
                ibd
              </option>
              <option value="http://edamontology.org/format_3578">
                IDAT
              </option>
              <option value="http://edamontology.org/format_3764">
                idXML
              </option>
              <option value="http://edamontology.org/format_1942">
                ig
              </option>
              <option value="http://edamontology.org/format_1943">
                igstrict
              </option>
              <option value="http://edamontology.org/format_1740">
                iHOP format
              </option>
              <option value="http://edamontology.org/format_3593">
                im
              </option>
              <option value="http://edamontology.org/format_3547">
                Image format
              </option>
              <option value="http://edamontology.org/format_3682">
                imzML metadata file
              </option>
              <option value="http://edamontology.org/format_1197">
                InChI
              </option>
              <option value="http://edamontology.org/format_1199">
                InChIKey
              </option>
              <option value="http://edamontology.org/format_3287">
                Individual genetic data format
              </option>
              <option value="http://edamontology.org/format_2185">
                insdxml
              </option>
              <option value="http://edamontology.org/format_1341">
                InterPro hits format
              </option>
              <option value="http://edamontology.org/format_1343">
                InterPro match table format
              </option>
              <option value="http://edamontology.org/format_1342">
                InterPro protein view report format
              </option>
              <option value="http://edamontology.org/format_3846">
                InterProScan XML
              </option>
              <option value="http://edamontology.org/format_3687">
                ISA-TAB
              </option>
              <option value="http://edamontology.org/format_1944">
                jackknifer
              </option>
              <option value="http://edamontology.org/format_1970">
                jackknifernon
              </option>
              <option value="http://edamontology.org/format_1367">
                JASPAR format
              </option>
              <option value="http://edamontology.org/format_3859">
                JCAMP-DX
              </option>
              <option value="http://edamontology.org/format_3579">
                JPG
              </option>
              <option value="http://edamontology.org/format_3464">
                JSON
              </option>
              <option value="http://edamontology.org/format_3749">
                JSON-LD
              </option>
              <option value="http://edamontology.org/format_3847">
                KGML
              </option>
              <option value="http://edamontology.org/format_3765">
                KNIME datatable format
              </option>
              <option value="http://edamontology.org/format_3254">
                KRSS2 Syntax
              </option>
              <option value="http://edamontology.org/format_3817">
                latex
              </option>
              <option value="http://edamontology.org/format_3014">
                LAV
              </option>
              <option value="http://edamontology.org/format_1337">
                lhf
              </option>
              <option value="http://edamontology.org/format_3748">
                Linked data format
              </option>
              <option value="http://edamontology.org/format_3728">
                LocARNA PP
              </option>
              <option value="http://edamontology.org/format_3008">
                MAF
              </option>
              <option value="http://edamontology.org/format_3161">
                MAGE-ML
              </option>
              <option value="http://edamontology.org/format_3162">
                MAGE-TAB
              </option>
              <option value="http://edamontology.org/format_3253">
                Manchester OWL Syntax
              </option>
              <option value="http://edamontology.org/format_3285">
                MAP
              </option>
              <option value="http://edamontology.org/format_2060">
                Map format
              </option>
              <option value="http://edamontology.org/format_1985">
                markx0
              </option>
              <option value="http://edamontology.org/format_2922">
                markx0 variant
              </option>
              <option value="http://edamontology.org/format_1986">
                markx1
              </option>
              <option value="http://edamontology.org/format_1987">
                markx10
              </option>
              <option value="http://edamontology.org/format_1988">
                markx2
              </option>
              <option value="http://edamontology.org/format_1989">
                markx3
              </option>
              <option value="http://edamontology.org/format_3713">
                Mascot .dat file
              </option>
              <option value="http://edamontology.org/format_1945">
                mase format
              </option>
              <option value="http://edamontology.org/format_3245">
                Mass spectrometry data format
              </option>
              <option value="http://edamontology.org/format_3626">
                MAT
              </option>
              <option value="http://edamontology.org/format_1990">
                match
              </option>
              <option value="http://edamontology.org/format_3033">
                Matrix format
              </option>
              <option value="http://edamontology.org/format_3714">
                MaxQuant APL peaklist format
              </option>
              <option value="http://edamontology.org/format_3777">
                MCPD
              </option>
              <option value="http://edamontology.org/format_3878">
                mdcrd
              </option>
              <option value="http://edamontology.org/format_2194">
                medline
              </option>
              <option value="http://edamontology.org/format_1735">
                Medline Display Format
              </option>
              <option value="http://edamontology.org/format_1991">
                mega
              </option>
              <option value="http://edamontology.org/format_2923">
                mega variant
              </option>
              <option value="http://edamontology.org/format_1946">
                mega-seq
              </option>
              <option value="http://edamontology.org/format_1992">
                meganon
              </option>
              <option value="http://edamontology.org/format_1369">
                MEME background Markov model
              </option>
              <option value="http://edamontology.org/format_1350">
                MEME Dirichlet prior
              </option>
              <option value="http://edamontology.org/format_1360">
                meme-motif
              </option>
              <option value="http://edamontology.org/format_1198">
                mf
              </option>
              <option value="http://edamontology.org/format_3651">
                MGF
              </option>
              <option value="http://edamontology.org/format_3550">
                mhd
              </option>
              <option value="http://edamontology.org/format_3556">
                MHTML
              </option>
              <option value="http://edamontology.org/format_2056">
                Microarray experiment data format
              </option>
              <option value="http://edamontology.org/format_1629">
                mira
              </option>
              <option value="http://edamontology.org/format_3864">
                mirGFF3
              </option>
              <option value="http://edamontology.org/format_1477">
                mmCIF
              </option>
              <option value="http://edamontology.org/format_3816">
                Mol2
              </option>
              <option value="http://edamontology.org/format_3815">
                Molfile
              </option>
              <option value="http://edamontology.org/format_3849">
                MSAML
              </option>
              <option value="http://edamontology.org/format_3702">
                MSF
              </option>
              <option value="http://edamontology.org/format_3911">
                msh
              </option>
              <option value="http://edamontology.org/format_1334">
                mspcrunch
              </option>
              <option value="http://edamontology.org/format_3834">
                mzData
              </option>
              <option value="http://edamontology.org/format_3247">
                mzIdentML
              </option>
              <option value="http://edamontology.org/format_3244">
                mzML
              </option>
              <option value="http://edamontology.org/format_3248">
                mzQuantML
              </option>
              <option value="http://edamontology.org/format_3681">
                mzTab
              </option>
              <option value="http://edamontology.org/format_3654">
                mzXML
              </option>
              <option value="http://edamontology.org/format_3256">
                N-Triples
              </option>
              <option value="http://edamontology.org/format_1948">
                nbrf/pir
              </option>
              <option value="http://edamontology.org/format_1972">
                NCBI format
              </option>
              <option value="http://edamontology.org/format_3650">
                netCDF
              </option>
              <option value="http://edamontology.org/format_1910">
                newick
              </option>
              <option value="http://edamontology.org/format_3160">
                NeXML
              </option>
              <option value="http://edamontology.org/format_1912">
                Nexus format
              </option>
              <option value="http://edamontology.org/format_1949">
                nexus-seq
              </option>
              <option value="http://edamontology.org/format_1973">
                nexusnon
              </option>
              <option value="http://edamontology.org/format_3549">
                nii
              </option>
              <option value="http://edamontology.org/format_3862">
                NLP annotation format
              </option>
              <option value="http://edamontology.org/format_3863">
                NLP corpus format
              </option>
              <option value="http://edamontology.org/format_3841">
                NLP format
              </option>
              <option value="http://edamontology.org/format_3824">
                NMR data format
              </option>
              <option value="http://edamontology.org/format_3906">
                NMReDATA
              </option>
              <option value="http://edamontology.org/format_3825">
                nmrML
              </option>
              <option value="http://edamontology.org/format_3257">
                Notation3
              </option>
              <option value="http://edamontology.org/format_3551">
                nrrd
              </option>
              <option value="http://edamontology.org/format_2061">
                Nucleic acid features (primers) format
              </option>
              <option value="http://edamontology.org/format_2158">
                Nucleic acid features (restriction sites) format
              </option>
              <option value="http://edamontology.org/format_1207">
                nucleotide
              </option>
              <option value="http://edamontology.org/format_2549">
                OBO
              </option>
              <option value="http://edamontology.org/format_2196">
                OBO format
              </option>
              <option value="http://edamontology.org/format_2550">
                OBO-XML
              </option>
              <option value="http://edamontology.org/format_3727">
                OME-TIFF
              </option>
              <option value="http://edamontology.org/format_2195">
                Ontology format
              </option>
              <option value="http://edamontology.org/format_3784">
                Open Annotation format
              </option>
              <option value="http://edamontology.org/format_3850">
                OrthoXML
              </option>
              <option value="http://edamontology.org/format_1741">
                OSCAR format
              </option>
              <option value="http://edamontology.org/format_2197">
                OWL format
              </option>
              <option value="http://edamontology.org/format_3252">
                OWL Functional Syntax
              </option>
              <option value="http://edamontology.org/format_3262">
                OWL/XML
              </option>
              <option value="http://edamontology.org/format_1996">
                pair
              </option>
              <option value="http://edamontology.org/format_3601">
                pbm
              </option>
              <option value="http://edamontology.org/format_3874">
                PCAzip
              </option>
              <option value="http://edamontology.org/format_3594">
                pcd
              </option>
              <option value="http://edamontology.org/format_1551">
                Pcons report format
              </option>
              <option value="http://edamontology.org/format_3595">
                pcx
              </option>
              <option value="http://edamontology.org/format_1476">
                PDB
              </option>
              <option value="http://edamontology.org/format_1475">
                PDB database entry format
              </option>
              <option value="http://edamontology.org/format_1950">
                pdbatom
              </option>
              <option value="http://edamontology.org/format_1951">
                pdbatomnuc
              </option>
              <option value="http://edamontology.org/format_1478">
                PDBML
              </option>
              <option value="http://edamontology.org/format_1953">
                pdbseqres
              </option>
              <option value="http://edamontology.org/format_1952">
                pdbseqresnuc
              </option>
              <option value="http://edamontology.org/format_3508">
                PDF
              </option>
              <option value="http://edamontology.org/format_1954">
                Pearson format
              </option>
              <option value="http://edamontology.org/format_3286">
                PED
              </option>
              <option value="http://edamontology.org/format_3288">
                PED/MAP
              </option>
              <option value="http://edamontology.org/format_3655">
                pepXML
              </option>
              <option value="http://edamontology.org/format_3602">
                pgm
              </option>
              <option value="http://edamontology.org/format_3012">
                pgSnp
              </option>
              <option value="http://edamontology.org/format_1633">
                PHD
              </option>
              <option value="http://edamontology.org/format_1432">
                Phylip character frequencies format
              </option>
              <option value="http://edamontology.org/format_1434">
                Phylip cliques format
              </option>
              <option value="http://edamontology.org/format_1430">
                Phylip continuous quantitative characters
              </option>
              <option value="http://edamontology.org/format_1433">
                Phylip discrete states format
              </option>
              <option value="http://edamontology.org/format_1423">
                Phylip distance matrix
              </option>
              <option value="http://edamontology.org/format_1997">
                PHYLIP format
              </option>
              <option value="http://edamontology.org/format_2924">
                Phylip format variant
              </option>
              <option value="http://edamontology.org/format_1998">
                PHYLIP sequential
              </option>
              <option value="http://edamontology.org/format_1445">
                Phylip tree distance format
              </option>
              <option value="http://edamontology.org/format_1435">
                Phylip tree format
              </option>
              <option value="http://edamontology.org/format_1425">
                Phylip tree raw
              </option>
              <option value="http://edamontology.org/format_2036">
                Phylogenetic character data format
              </option>
              <option value="http://edamontology.org/format_2037">
                Phylogenetic continuous quantitative character format
              </option>
              <option value="http://edamontology.org/format_2038">
                Phylogenetic discrete states format
              </option>
              <option value="http://edamontology.org/format_2006">
                Phylogenetic tree format
              </option>
              <option value="http://edamontology.org/format_2556">
                Phylogenetic tree format (text)
              </option>
              <option value="http://edamontology.org/format_2557">
                Phylogenetic tree format (XML)
              </option>
              <option value="http://edamontology.org/format_2039">
                Phylogenetic tree report (cliques) format
              </option>
              <option value="http://edamontology.org/format_2040">
                Phylogenetic tree report (invariants) format
              </option>
              <option value="http://edamontology.org/format_2049">
                Phylogenetic tree report (tree distances) format
              </option>
              <option value="http://edamontology.org/format_3159">
                phyloXML
              </option>
              <option value="http://edamontology.org/format_3015">
                Pileup
              </option>
              <option value="http://edamontology.org/format_3653">
                pkl
              </option>
              <option value="http://edamontology.org/format_1964">
                plain text format (unformatted)
              </option>
              <option value="http://edamontology.org/format_1861">
                PlasMapper TextMap
              </option>
              <option value="http://edamontology.org/format_1739">
                pmc
              </option>
              <option value="http://edamontology.org/format_3726">
                PMML
              </option>
              <option value="http://edamontology.org/format_3603">
                PNG
              </option>
              <option value="http://edamontology.org/format_3330">
                PO
              </option>
              <option value="http://edamontology.org/format_3596">
                ppm
              </option>
              <option value="http://edamontology.org/format_3838">
                pptx
              </option>
              <option value="http://edamontology.org/format_3684">
                PRIDE XML
              </option>
              <option value="http://edamontology.org/format_1627">
                Primer3 primer
              </option>
              <option value="http://edamontology.org/format_3826">
                proBAM
              </option>
              <option value="http://edamontology.org/format_3827">
                proBED
              </option>
              <option value="http://edamontology.org/format_1552">
                ProQ report format
              </option>
              <option value="http://edamontology.org/format_1356">
                prosite-pattern
              </option>
              <option value="http://edamontology.org/format_1366">
                prosite-profile
              </option>
              <option value="http://edamontology.org/format_1208">
                protein
              </option>
              <option value="http://edamontology.org/format_3097">
                Protein domain classification format
              </option>
              <option value="http://edamontology.org/format_2052">
                Protein family report format
              </option>
              <option value="http://edamontology.org/format_2054">
                Protein interaction format
              </option>
              <option value="http://edamontology.org/format_2062">
                Protein report format
              </option>
              <option value="http://edamontology.org/format_2077">
                Protein secondary structure format
              </option>
              <option value="http://edamontology.org/format_2065">
                Protein structure report (quality evaluation) format
              </option>
              <option value="http://edamontology.org/format_3747">
                protXML
              </option>
              <option value="http://edamontology.org/format_3696">
                PS
              </option>
              <option value="http://edamontology.org/format_3597">
                psd
              </option>
              <option value="http://edamontology.org/format_3851">
                PSDML
              </option>
              <option value="http://edamontology.org/format_3882">
                PSF
              </option>
              <option value="http://edamontology.org/format_3242">
                PSI MI TAB (MITAB)
              </option>
              <option value="http://edamontology.org/format_3158">
                PSI MI XML (MIF)
              </option>
              <option value="http://edamontology.org/format_3243">
                PSI-PAR
              </option>
              <option value="http://edamontology.org/format_3007">
                PSL
              </option>
              <option value="http://edamontology.org/format_3781">
                PubAnnotation format
              </option>
              <option value="http://edamontology.org/format_1734">
                PubMed citation
              </option>
              <option value="http://edamontology.org/format_3848">
                PubMed XML
              </option>
              <option value="http://edamontology.org/format_3783">
                PubTator format
              </option>
              <option value="http://edamontology.org/format_2094">
                pure
              </option>
              <option value="http://edamontology.org/format_1215">
                pure dna
              </option>
              <option value="http://edamontology.org/format_1210">
                pure nucleotide
              </option>
              <option value="http://edamontology.org/format_1219">
                pure protein
              </option>
              <option value="http://edamontology.org/format_1217">
                pure rna
              </option>
              <option value="http://edamontology.org/format_3683">
                qcML
              </option>
              <option value="http://edamontology.org/format_3607">
                qual
              </option>
              <option value="http://edamontology.org/format_3611">
                qual454
              </option>
              <option value="http://edamontology.org/format_3609">
                qualillumina
              </option>
              <option value="http://edamontology.org/format_3608">
                qualsolexa
              </option>
              <option value="http://edamontology.org/format_3610">
                qualsolid
              </option>
              <option value="http://edamontology.org/format_3787">
                Query language
              </option>
              <option value="http://edamontology.org/format_1295">
                quicktandem
              </option>
              <option value="http://edamontology.org/format_3554">
                R file format
              </option>
              <option value="http://edamontology.org/format_3605">
                rast
              </option>
              <option value="http://edamontology.org/format_1957">
                raw
              </option>
              <option value="http://edamontology.org/format_3099">
                Raw CATH domain classification format
              </option>
              <option value="http://edamontology.org/format_3828">
                Raw microarray data format
              </option>
              <option value="http://edamontology.org/format_3098">
                Raw SCOP domain classification format
              </option>
              <option value="http://edamontology.org/format_2571">
                Raw sequence format
              </option>
              <option value="http://edamontology.org/format_3580">
                rcc
              </option>
              <option value="http://edamontology.org/format_2376">
                RDF format
              </option>
              <option value="http://edamontology.org/format_3261">
                RDF/XML
              </option>
              <option value="http://edamontology.org/format_1320">
                REBASE restriction sites
              </option>
              <option value="http://edamontology.org/format_1958">
                refseqp
              </option>
              <option value="http://edamontology.org/format_3819">
                Relaxed PHYLIP Interleaved
              </option>
              <option value="http://edamontology.org/format_3820">
                Relaxed PHYLIP Sequential
              </option>
              <option value="http://edamontology.org/format_1319">
                restover format
              </option>
              <option value="http://edamontology.org/format_1318">
                restrict format
              </option>
              <option value="http://edamontology.org/format_3600">
                rgb
              </option>
              <option value="http://edamontology.org/format_1213">
                rna
              </option>
              <option value="http://edamontology.org/format_3865">
                RNA annotation format
              </option>
              <option value="http://edamontology.org/format_2076">
                RNA secondary structure format
              </option>
              <option value="http://edamontology.org/format_3311">
                RNAML
              </option>
              <option value="http://edamontology.org/format_3485">
                RSF
              </option>
              <option value="http://edamontology.org/format_3886">
                RST
              </option>
              <option value="http://edamontology.org/format_2573">
                SAM
              </option>
              <option value="http://edamontology.org/format_3813">
                SAMPLE file format
              </option>
              <option value="http://edamontology.org/format_1296">
                Sanger inverted repeats
              </option>
              <option value="http://edamontology.org/format_3692">
                SBGN-ML
              </option>
              <option value="http://edamontology.org/format_2585">
                SBML
              </option>
              <option value="http://edamontology.org/format_3725">
                SBOL
              </option>
              <option value="http://edamontology.org/format_3155">
                SBRML
              </option>
              <option value="http://edamontology.org/format_3688">
                SBtab
              </option>
              <option value="http://edamontology.org/format_1632">
                SCF
              </option>
              <option value="http://edamontology.org/format_1999">
                scores format
              </option>
              <option value="http://edamontology.org/format_3814">
                SDF
              </option>
              <option value="http://edamontology.org/format_3685">
                SED-ML
              </option>
              <option value="http://edamontology.org/format_2000">
                selex
              </option>
              <option value="http://edamontology.org/format_2919">
                Sequence annotation track format
              </option>
              <option value="http://edamontology.org/format_2055">
                Sequence assembly format
              </option>
              <option value="http://edamontology.org/format_2561">
                Sequence assembly format (text)
              </option>
              <option value="http://edamontology.org/format_2170">
                Sequence cluster format
              </option>
              <option value="http://edamontology.org/format_2172">
                Sequence cluster format (nucleic acid)
              </option>
              <option value="http://edamontology.org/format_2171">
                Sequence cluster format (protein)
              </option>
              <option value="http://edamontology.org/format_2067">
                Sequence distance matrix format
              </option>
              <option value="http://edamontology.org/format_1920">
                Sequence feature annotation format
              </option>
              <option value="http://edamontology.org/format_2548">
                Sequence feature table format
              </option>
              <option value="http://edamontology.org/format_2206">
                Sequence feature table format (text)
              </option>
              <option value="http://edamontology.org/format_2553">
                Sequence feature table format (XML)
              </option>
              <option value="http://edamontology.org/format_2155">
                Sequence features (repeats) format
              </option>
              <option value="http://edamontology.org/format_2068">
                Sequence motif format
              </option>
              <option value="http://edamontology.org/format_2069">
                Sequence profile format
              </option>
              <option value="http://edamontology.org/format_3606">
                Sequence quality report format (text)
              </option>
              <option value="http://edamontology.org/format_2078">
                Sequence range format
              </option>
              <option value="http://edamontology.org/format_1919">
                Sequence record format
              </option>
              <option value="http://edamontology.org/format_2551">
                Sequence record format (text)
              </option>
              <option value="http://edamontology.org/format_2552">
                Sequence record format (XML)
              </option>
              <option value="http://edamontology.org/format_2057">
                Sequence trace format
              </option>
              <option value="http://edamontology.org/format_2921">
                Sequence variation annotation format
              </option>
              <option value="http://edamontology.org/format_1419">
                Sequence-MEME profile alignment
              </option>
              <option value="http://edamontology.org/format_2014">
                Sequence-profile alignment format
              </option>
              <option value="http://edamontology.org/format_3758">
                SEQUEST .out file
              </option>
              <option value="http://edamontology.org/format_3701">
                Sequin format
              </option>
              <option value="http://edamontology.org/format_3852">
                SeqXML
              </option>
              <option value="http://edamontology.org/format_3284">
                SFF
              </option>
              <option value="http://edamontology.org/format_3619">
                sif
              </option>
              <option value="http://edamontology.org/format_1200">
                smarts
              </option>
              <option value="http://edamontology.org/format_1196">
                SMILES
              </option>
              <option value="http://edamontology.org/format_1335">
                Smith-Waterman format
              </option>
              <option value="http://edamontology.org/format_3624">
                snpeffdb
              </option>
              <option value="http://edamontology.org/format_3790">
                SPARQL
              </option>
              <option value="http://edamontology.org/format_3250">
                spML
              </option>
              <option value="http://edamontology.org/format_3555">
                SPSS
              </option>
              <option value="http://edamontology.org/format_3788">
                SQL
              </option>
              <option value="http://edamontology.org/format_3621">
                SQLite format
              </option>
              <option value="http://edamontology.org/format_3698">
                SRA format
              </option>
              <option value="http://edamontology.org/format_3017">
                SRF
              </option>
              <option value="http://edamontology.org/format_2002">
                srs format
              </option>
              <option value="http://edamontology.org/format_2003">
                srspair
              </option>
              <option value="http://edamontology.org/format_3310">
                SS
              </option>
              <option value="http://edamontology.org/format_1928">
                Staden experiment format
              </option>
              <option value="http://edamontology.org/format_1960">
                Staden format
              </option>
              <option value="http://edamontology.org/format_1961">
                Stockholm format
              </option>
              <option value="http://edamontology.org/format_1962">
                strider format
              </option>
              <option value="http://edamontology.org/format_2304">
                STRING entry format (XML)
              </option>
              <option value="http://edamontology.org/format_3604">
                SVG
              </option>
              <option value="http://edamontology.org/format_2004">
                T-Coffee format
              </option>
              <option value="http://edamontology.org/format_3616">
                tabix
              </option>
              <option value="http://edamontology.org/format_3700">
                Tabix index file format
              </option>
              <option value="http://edamontology.org/format_1665">
                Taverna workflow format
              </option>
              <option value="http://edamontology.org/format_2033">
                Tertiary structure format
              </option>
              <option value="http://edamontology.org/format_2021">
                Text mining report format
              </option>
              <option value="http://edamontology.org/format_2330">
                Textual format
              </option>
              <option value="http://edamontology.org/format_3712">
                Thermo RAW
              </option>
              <option value="http://edamontology.org/format_3835">
                TIDE TXT
              </option>
              <option value="http://edamontology.org/format_3591">
                TIFF
              </option>
              <option value="http://edamontology.org/format_3876">
                TNG
              </option>
              <option value="http://edamontology.org/format_3879">
                Topology format
              </option>
              <option value="http://edamontology.org/format_3866">
                Trajectory format
              </option>
              <option value="http://edamontology.org/format_3867">
                Trajectory format (binary)
              </option>
              <option value="http://edamontology.org/format_3868">
                Trajectory format (text)
              </option>
              <option value="http://edamontology.org/format_3246">
                TraML
              </option>
              <option value="http://edamontology.org/format_1436">
                TreeBASE format
              </option>
              <option value="http://edamontology.org/format_1911">
                TreeCon format
              </option>
              <option value="http://edamontology.org/format_2005">
                TreeCon-seq
              </option>
              <option value="http://edamontology.org/format_1437">
                TreeFam format
              </option>
              <option value="http://edamontology.org/format_3475">
                TSV
              </option>
              <option value="http://edamontology.org/format_3255">
                Turtle
              </option>
              <option value="http://edamontology.org/format_1206">
                unambiguous pure
              </option>
              <option value="http://edamontology.org/format_1214">
                unambiguous pure dna
              </option>
              <option value="http://edamontology.org/format_1211">
                unambiguous pure nucleotide
              </option>
              <option value="http://edamontology.org/format_1218">
                unambiguous pure protein
              </option>
              <option value="http://edamontology.org/format_1216">
                unambiguous pure rna sequence
              </option>
              <option value="http://edamontology.org/format_2096">
                unambiguous sequence
              </option>
              <option value="http://edamontology.org/format_3853">
                UniParc XML
              </option>
              <option value="http://edamontology.org/format_2187">
                UniProt-like (text)
              </option>
              <option value="http://edamontology.org/format_1963">
                UniProtKB format
              </option>
              <option value="http://edamontology.org/format_3771">
                UniProtKB RDF
              </option>
              <option value="http://edamontology.org/format_3770">
                UniProtKB XML
              </option>
              <option value="http://edamontology.org/format_2547">
                uniprotkb-like format
              </option>
              <option value="http://edamontology.org/format_3854">
                UniRef XML
              </option>
              <option value="http://edamontology.org/format_2095">
                unpure
              </option>
              <option value="http://edamontology.org/format_3016">
                VCF
              </option>
              <option value="http://edamontology.org/format_3699">
                VDB
              </option>
              <option value="http://edamontology.org/format_1458">
                Vienna local RNA secondary structure format
              </option>
              <option value="http://edamontology.org/format_3821">
                VisML
              </option>
              <option value="http://edamontology.org/format_3858">
                Waters RAW
              </option>
              <option value="http://edamontology.org/format_3710">
                WIFF format
              </option>
              <option value="http://edamontology.org/format_3005">
                WIG
              </option>
              <option value="http://edamontology.org/format_2032">
                Workflow format
              </option>
              <option value="http://edamontology.org/format_3711">
                X!Tandem XML
              </option>
              <option value="http://edamontology.org/format_3598">
                xbm
              </option>
              <option value="http://edamontology.org/format_3618">
                xgmml
              </option>
              <option value="http://edamontology.org/format_3468">
                xls
              </option>
              <option value="http://edamontology.org/format_3620">
                xlsx
              </option>
              <option value="http://edamontology.org/format_3811">
                XMFA
              </option>
              <option value="http://edamontology.org/format_2332">
                XML
              </option>
              <option value="http://edamontology.org/format_3599">
                xpm
              </option>
              <option value="http://edamontology.org/format_3789">
                XQuery
              </option>
              <option value="http://edamontology.org/format_3804">
                xsd
              </option>
              <option value="http://edamontology.org/format_3875">
                XTC
              </option>
              <option value="http://edamontology.org/format_3877">
                XYZ
              </option>
              <option value="http://edamontology.org/format_3750">
                YAML
              </option>
              <option value="http://edamontology.org/format_3018">
                ZTR
              </option>
            </select>
          </div>
        </td>
        <td colSpan={2}>
          <div type="button" className={styles.attachbuttondisabled}>
            Attach
          </div>
        </td>
      </tr>
    </React.Fragment>
  );
}