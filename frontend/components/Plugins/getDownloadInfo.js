import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

export default function getDownloadInfo (properties) {

  var graphUri;
  var url;
  var designId;
  var share;







    const pluginData = {
        complete_sbol: '',
        shallow_sbol: '',
        genbank: '',
        top_level: '',
        instanceUrl: '',
        size: 0,
        type: properties.type
      };


      return pluginData

}