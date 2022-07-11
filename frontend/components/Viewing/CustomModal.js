import styles from "../../styles/view.module.css";
import { faWindowClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * A custom modal class that has error message handling.
 * 
 * @param {Any} properties Information passed in from the parent component.
 */
export default function CustomModal(properties) {
  //Properties for the warning toast.
  const warningToast = (message) => toast.warn(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    className: styles.modaltoast
  });

  /**
   * Animates the modal out of the screen and then hides it when the animation is over.
  */
  const hideAnimation = () => {
    const container = document.getElementsByClassName(styles.modalcontainer)[0];
    container.classList.add(styles.modalanimationremove);

    //Waits 0.4 seconds to hide the modal so the full remove animation can play out.
    setTimeout(() => {
      properties.setModal("");
    }, 400);
  }

  /**
   * Creates a portal on the body element.
   * 
   * @param {Any} children The children elements to render. 
  */
  const ModalPortal = ({ children }) => {
    return createPortal(
      <div className={styles.custommodal} onClick={() => {
        //Handles clicking outside of the modal to close it.
        window.addEventListener("click", function (event) {
          if (event.target.className === styles.custommodal) hideAnimation();
        });
      }}>
        {children}
      </div>,
      document.body
    );
  };

  //Adds and removes the initial modal animation and makes the page scrollable depending on if the modal is shown.
  useEffect(() => {
    document.body.style.overflow = "hidden"
    const container = document.getElementsByClassName(styles.modalcontainer)[0];
    container.classList.add(styles.modalanimationadd);

    return () => {
      container.classList.remove(styles.modalanimationadd);
      document.body.style.overflow = "visible";
    };
  }, []);

  return (
    <ModalPortal>
      <div className={styles.modalcontainer}>
        <FontAwesomeIcon
          icon={faWindowClose}
          size="1x"
          className={styles.closemodal}
          onClick={() => {
            hideAnimation();
          }}
        />
        {properties.header}
        <hr></hr>
        {properties.content}
        <hr></hr>
        <div className={styles.modalbuttons}>
          {properties.buttonText[0] ? (
            <div
              className={styles.modalbuttonone}
              type="button"
              onClick={() => {
                hideAnimation();
              }}
            >
              {properties.buttonText[0]}
            </div>
          ) : null}
          {properties.buttonText[1] ? (
            <div
              className={styles.modalbuttontwo}
              type="button"
              onClick={() => {
                if (properties.submittable) {
                  hideAnimation();
                } else warningToast(properties.error);
              }}
            >
              {properties.buttonText[1]}
            </div>
          ) : null}
        </div>
      </div>
    </ModalPortal>
  );
}
