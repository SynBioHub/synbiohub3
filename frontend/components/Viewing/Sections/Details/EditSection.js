import styles from "../../../../styles/view.module.css";
import { faBold, faGlobeAmericas, faImage, faItalic, faUnderline } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import axios from "axios";
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

/**
 * Rendered when the user is adding an attribute or they are editing a current attribute.
 * Allows the user to bold, italicize, underline, add image, and add links to the field.
 * 
 * @param {Any} properties Information passed in from the parent component.
 * @returns Buttons to modify text, and input field and save/cancel buttons.
 */
export default function EditSection(properties) {
  /*
  TODO
  Adding uploading images and make sure they show up.
  Add a loader for when the user is adding references.
  Fix so when multiple citations are being uploaded only ones that are valid are uploaded.
  For example 345452452452345 isn't uploaded because it's not valid.
  */

  /**
   * Using the title the content is uploaded the the correct endpoint.
   * 
   * @param {String} title The title of the section that is being updated.
   * @param {String} content The content of the section that is being updated.
   */
  const uploadInput = async (title, content) => {
    let endpoint;
    if (title === "Description") endpoint = "updateMutableDescription";
    else if (title === "Notes") endpoint = "updateMutableNotes";
    else if (title === "Source") endpoint = "updateMutableSource";
    else if (title === "References") endpoint = "updateCitations";

    const url = `${publicRuntimeConfig.backend}/${endpoint}`;
    const headers = {
      Accept: "text/plain; charset=UTF-8",
      "X-authorization": properties.token
    };

    const parameters = new URLSearchParams();
    parameters.append("uri", properties.uri);
    parameters.append("value", content);

    let response;

    try {
      response = await axios.post(url, parameters, { headers });
    } catch (error) {
      if (error.response) {
        console.error('Error:', error.message);
      }
    }

    // if (response.status !== 200) console.error(response.status);
  }

  /**
   * Updates the textarea with the supplied tag at the current cursor position.
   * 
   * @param {String} tag The tag that should be appended to the textarea when the function is called.
   */
  const insertInTextArea = (tag) => {
    const textarea = document.getElementsByClassName(`edit-input-${properties.title}`)[0];
    textarea.focus();
    textarea.setRangeText(tag, textarea.selectionStart, textarea.selectionEnd);
  }

  /**
   * Gets the individual PMID's from the citation string.
   * 
   * @param {String} citation The citations to find the PMID's from.
   */
  const getPMID = (citations) => {
    if(citations !== undefined) {
      const splitCitations = citations.split("<br><br>");
      const pmids = [];
  
      for (let citation of splitCitations) {
        const start = citation.indexOf("\">") + 2;
        const end = citation.indexOf("</a></b>.");
        pmids.push(citation.slice(start, end));
      }
  
      return pmids.join(", ");
    }
  }

  return (
    <div className={styles.editinput}>
      <div className={styles.editbuttons}>
        <div
          onClick={() => {
            insertInTextArea("<b></b>");
          }}
        >
          <FontAwesomeIcon
            title="Bold"
            icon={faBold}
            size="1x"
            color="#465875"
            className={styles.editbutton}
          />
        </div>
        <div
          onClick={() => {
            insertInTextArea("<i></i>");
          }}
        >
          <FontAwesomeIcon
            title="Italic"
            icon={faItalic}
            size="1x"
            color="#465875"
            className={styles.editbutton}
          />
        </div>
        <div
          onClick={() => {
            insertInTextArea("<u></u>")
          }}
        >
          <FontAwesomeIcon
            title="Underline"
            icon={faUnderline}
            size="1x"
            color="#465875"
            className={styles.editbutton}
          />
        </div>
        <div
          onClick={() => {
            insertInTextArea("<img src = '' />");
          }}
        >
          <FontAwesomeIcon
            title="Insert Image"
            icon={faImage}
            size="1x"
            color="#465875"
            className={styles.editbutton}
          />
        </div>
        <div
          onClick={() => {
            insertInTextArea('<a href="http://example.com" target = "_blank">link text</a>');
          }}
        >
          <FontAwesomeIcon
            title="Insert URL"
            icon={faGlobeAmericas}
            size="1x"
            color="#465875"
            className={styles.editbutton}
          />
        </div>
      </div>
      <textarea
        className={`edit-input-${properties.title}`}
        id="edit-input"
        defaultValue={properties.title === "References" ? getPMID(properties.content) : properties.content}
        placeholder={properties.title === "References" ? "Please enter comma-separated PubMedIds" : ""}
      ></textarea>
      <div>
        <button
          onClick={() => {
            const inputValue = document.getElementsByClassName(`edit-input-${properties.title}`)[0].value;
            const trimmedInput = inputValue.replace(/\s/g, "");

            const updateView = () => {
              //Posts the updated input and then gives the parent component back the updated details.
              uploadInput(properties.title, properties.title === "References" ? trimmedInput : inputValue).then(() => {
                properties.setDetails(details => {
                  switch (properties.title) {
                    case "Description":
                      return ({ ...details, mutableDescription: inputValue });
                    case "Notes":
                      return ({ ...details, mutableNotes: inputValue });
                    case "Source":
                      return ({ ...details, mutableProvenance: inputValue });
                    case "References":
                      return ({ ...details, citation: inputValue });
                  }
                });

                //Hides the textarea.
                properties.setShowEdit(curr => curr.filter(e => e !== properties.title));
              });
            }

            //References must be parsed before they are displayed.
            if (properties.title === "References") {
              //If the user is adding references the input must be in the correct form.
              const citationRegEx = /^[0-9]+(,[0-9]+)*$/;
              if (trimmedInput !== "" && !citationRegEx.test(trimmedInput)) {
                alert("Citations must be comma separated PubMed IDs");
                return;
              }

              //Parses the citation info and sets it to a variable.
              getCitationInfo(trimmedInput).then(parsedCitations => {
                if (parsedCitations === undefined || (Array.isArray(parsedCitations) && parsedCitations.length === 0) && trimmedInput !== "") {
                  alert("Invalid PMID.");
                } else {
                  updateView();

                  const list = [];
                  parsedCitations.forEach(citation => {
                    list.push(citation);
                  });

                  //Joins the list with line breaks so html-react-parser renders line breaks between citations.
                  properties.setReferences(list.join("<br><br>"));
                }
              });
            } else updateView();
          }}
        >
          Save {properties.title}
        </button>
        <button
          onClick={() => {
            //Hides the textarea.
            properties.setShowEdit(curr => curr.filter(e => e !== properties.title));
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * Parses the xml to be in the correct citation format.
 * 
 * @param {XML} info The XMl that is returned from the POST call.
 */
const parseCitationInfo = (info) => {
  let xml, citations = [];
  if (window.DOMParser) {
    const parser = new DOMParser();
    xml = parser.parseFromString(info, "text/xml");
  } else {
    //Internet Explorer
    xml = new ActiveXObject("Microsoft.XMLDOM");
    xml.async = false;
    xml.loadXML(info);
  }

  /**
   * Shortens and simplifys getting xml tag elements.
   * Handles if there is a missing tag in the XML and returns "" instead.
   * 
   * @param {XMl} article The xml to find the tag from.
   * @param {String} element The name of the tag to find.
   */
  const getTag = (article, element) => {
    try {
      return article.getElementsByTagName(element)[0].childNodes[0].nodeValue;
    } catch {
      return "";
    }
  }

  //Gets the correct tags/order for each article in the XML response.
  [...xml.getElementsByTagName("PubmedArticle")].forEach(article => {
    let citation = "";

    [...article.getElementsByTagName("Author")].forEach(author => {
      citation += `${getTag(author, "LastName")}, ${getTag(author, "ForeName")}., `;
    });

    citation += `"${getTag(article, "ArticleTitle")}", ${getTag(article, "Title")},`;

    [...article.getElementsByTagName("PubDate")].forEach(child => {
      citation += ` ${getTag(child, "Year")}, ${getTag(child, "Month")} `;
    });

    const pmidLink = `https://www.ncbi.nlm.nih.gov/pubmed/${getTag(article, "PMID")}`;

    citation += `${getTag(article, "Volume")}(${getTag(article, "Issue")}): ${getTag(article, "MedlinePgn")}, PMID: <b><a href="${pmidLink}">${getTag(article, "PMID")}</a></b>.`;

    citations.push(citation);
  });

  return citations;
}

/**
 * @param {Array} id An array of ids to add as references.
 * @returns The parsed xml for the id's.
 */
const getCitationInfo = async (ids) => {
  const url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";

  const parameters = new URLSearchParams();
  parameters.append("db", "pubmed");
  parameters.append("id", ids);
  parameters.append("retmode", "xml");

  try {
    const response = await axios.post(url, parameters);

    const citationXML = await response.data;
    if (response.status === 200) return parseCitationInfo(citationXML);
    else return undefined;
  } catch(e) {
    return undefined;
  }
}

//Details needs this information to set the default look of references.
export { getCitationInfo };