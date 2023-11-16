import { useEffect, useState } from 'react';
import MiniLoading from '../../../Reusable/MiniLoading';
import executeQueryFromTableJSON from '../Fetching/executeQueryFromTableJSON';
import getQueryStackTrace from '../Fetching/getQueryStackTrace';
import parseQueryResult from '../Fetching/parseQueryResult';
import useRegistries from '../Fetching/useRegistries';
import createRenderingObject from './createRenderingObject';
import SectionRenderer from './SectionRenderer';
import { useDispatch } from 'react-redux';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

function handleExternalFetch(
  dispatch,
  stackTrace,
  key,
  sectionIndex,
  updateSectionsToParse,
  setLoading,
  registries,
  loading,
  error
) {
  if (!error && !loading) {
    setLoading(true);
    // const queryUrl = registries.find(registry => {
    //   return stackTrace.uri.startsWith(registry.uri);
    // })?.url;
    const queryUrl = publicRuntimeConfig.backend;
    if (queryUrl) {
      executeQueryFromTableJSON(
        dispatch,
        stackTrace.uri,
        stackTrace.prefixes,
        stackTrace.table,
        queryUrl
      ).then(result => {
        try {
          let [fetchedSection] = parseQueryResult(
            stackTrace.table,
            result,
            stackTrace.prefixes
          );
          if (fetchedSection) {
            const [[newSection]] = Object.values(fetchedSection);
            updateSectionsToParse(key, sectionIndex, newSection);
            if (newSection.value) {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        } catch (error) {
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }
  }
}

function createKeyToValueMap(
  dispatch,
  sections,
  updateSectionsToParse,
  setTitleToValueMap,
  setSectionsToRender,
  setLoading,
  registries,
  registriesLoading,
  error
) {
  const map = {};
  const sectionsToRender = [];
  Object.keys(sections).forEach(key => {
    let currentSection = sections[key];
    const foundData = currentSection.some((possibility, index) => {
      const titleKey = possibility.section.title.split('__')[0];
      if (
        possibility.section &&
        !possibility.section.predicates &&
        possibility.section.text
      ) {
        map[titleKey] = {
          value: possibility.section.text,
          index
        };
        sectionsToRender.push({
          ...possibility.section,
          key: titleKey,
          tableIcon: possibility.table.icon
        });
        return true;
      } else if (!possibility.value) {
        const stackTrace = getQueryStackTrace(
          possibility.table,
          possibility.section,
          possibility.result,
          possibility.prefixes
        );
        if (stackTrace) {
          handleExternalFetch(
            dispatch,
            stackTrace,
            key,
            index,
            updateSectionsToParse,
            setLoading,
            registries,
            registriesLoading,
            error
          );
        }
      } else {
        if (map[titleKey] && map[titleKey].value !== '') return true;
        map[titleKey] = { value: possibility.value, index };
        // check if already in sectionsToRender, overwrite if that's the case
        const index = sectionsToRender.findIndex(
          section => section.key === titleKey
        );
        if (index === -1) {
          sectionsToRender.push({
            ...possibility.section,
            key: titleKey,
            tableIcon: possibility.table.icon
          });
        } else {
          sectionsToRender[index] = {
            ...possibility.section,
            key: titleKey,
            tableIcon: possibility.table.icon
          };
        }
        return true;
      }
    });
    if (!foundData && currentSection.length > 0) {
      const titleKey = currentSection[0].section.title;
      if (!(map[titleKey] && map[titleKey].value !== '')) {
        map[titleKey] = { value: '', index: 0 };
        const index = sectionsToRender.findIndex(
          section => section.key === titleKey
        );
        if (index == -1) {
          sectionsToRender.push({
            ...currentSection[0].section,
            key: titleKey,
            tableIcon: currentSection[0].table.icon
          });
        } else {
          sectionsToRender[index] = {
            ...currentSection[0].section,
            key: titleKey,
            tableIcon: currentSection[0].table.icon
          };
        }
      }
    }
  });
  setSectionsToRender(sectionsToRender);
  // console.log([...sectionsToRender]);
  // console.log({ ...map });
  Object.keys(map).forEach(key => {
    map[key].value = loadText(map[key].value, map);
  });
  setTitleToValueMap(map);
}

function loadText(template, args) {
  for (const key of Object.keys(args)) {
    template = template.replace(
      new RegExp(`\\$<${key}>`, 'g'),
      args[key].value
    );
  }

  return template;
}

export default function RowWrapper({ sections, metadata, setSectionIcon }) {
  // go through each of the sections in the and attempt to resolve what the section's value should be
  const [sectionsToParse, setSectionsToParse] = useState(sections);
  const [loading, setLoading] = useState(false);
  const [titleToValueMap, setTitleToValueMap] = useState({});
  const [sectionsToRender, setSectionsToRender] = useState([]);
  const [content, setContent] = useState(null);
  const dispatch = useDispatch();

  const {
    registries,
    loading: registriesLoading,
    error
  } = useRegistries(dispatch);

  const updateSectionsToParse = (key, index, newSection) => {
    const newSections = { ...sectionsToParse };
    newSections[key][index] = newSection;
    setSectionsToParse(newSections);
  };

  useEffect(() => {
    if (sectionsToParse) {
      createKeyToValueMap(
        dispatch,
        sectionsToParse,
        updateSectionsToParse,
        setTitleToValueMap,
        setSectionsToRender,
        setLoading,
        registries,
        registriesLoading,
        error
      );
    }
  }, [sectionsToParse, registries, registriesLoading, error]);

  useEffect(() => {
    let sectionIcon = null;
    const toRender = sectionsToRender
      .map(section => {
        return createRenderingObject(
          section,
          titleToValueMap[section.key].value,
          titleToValueMap
        );
      })
      .filter(section => !section.hidden);
    const newContent = toRender.map(section => {
      if (section.tableIcon) {
        sectionIcon = section.tableIcon;
      }
      return (
        <SectionRenderer
          section={section}
          metadata={metadata}
          key={section.id}
        />
      );
    });
    setContent(newContent);
    if (metadata) setSectionIcon(sectionIcon);
  }, [titleToValueMap, sectionsToRender]);


  if (loading) {
    return (
      <tr>
        <td colSpan="100%">  {/* colSpan="100%" makes sure it spans the entire width of the table */}
          <MiniLoading height={10} width={50} />
        </td>
      </tr>
    );
  }  
  return <tr>{content}</tr>;
}
