import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import styles from '../../styles/submit.module.css';


export default function AddToCollectionButton(properties) {
    const selectedCollection = useSelector(state => state.submit.selectedCollection);
    const [canSubmit, setCanSubmit] = useState();
    const token = useSelector(state => state.user.token);
    const theme = JSON.parse(localStorage.getItem('theme')) || {};

    useEffect(() => {
        setCanSubmit(!(properties.files.length === 0 || !selectedCollection));
      }, [selectedCollection, properties.files]);


    //Properties for the error toast.
    const errorToast = (message) => toast.error(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: styles.modaltoast
    });
    
    //Properties for the success toast.
    const successToast = (message) => toast.success(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: styles.modaltoast
    });

    const addToCollection = async (collection,itemUrl) => {
        const url = `${publicRuntimeConfig.backend}/${itemUrl}/addToCollection`;
        var headers = {
        Accept: "text/plain; charset=UTF-8",
        "X-authorization": token
        };

        const parameters = new URLSearchParams();
        parameters.append("collections", collection);

        let response;

        try {
        response = await axios.post(url, parameters, { headers });
        } catch (error) {
            if (error.response) {
                console.error('Error:', error.message);
            }
        }

        return response.status === 200;
    }


    return (
        <div
          className={`${styles.submitbuttoncontainer} ${
            !canSubmit && styles.disabledsubmitbutton
          }`}
          role="button"
          onClick={async () => {
            if (!canSubmit) return;
            const files = properties.files || [];
            const results = await Promise.allSettled(
              files.map((file) => addToCollection(selectedCollection.uri, file.uri.replace(theme.uriPrefix, "")))
            );

            let allSuccessful = true;
            
            results.forEach((result, idx) => {
              if (!result) {
                errorToast(`Failed to add file ${files[idx].name} to collection.`);
                allSuccessful = false;
              }
            });

            if (allSuccessful) {
              successToast("All files added to the collection!");
            }
            properties.setCreateCollectionMode(false);
            properties.setShowBasket(false);
          }}
        >
          <FontAwesomeIcon
            icon={faPlus}
            size="1x"
            color="#F2E86D"
            className={styles.submitbuttonicon}
          />
          Add To Collection
        </div>
      );
}

