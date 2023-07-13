import ComponentDefinition from './Types/ComponentDefinition.json';
import Collection from './Types/Collection.json';
import Sequence from './Types/Sequence.json';
import Model from './Types/Model.json';
import ModuleDefinition from './Types/ModuleDefinition.json';
import Implementation from './Types/Implementation.json';
import Range from './Types/Range.json';
import Experiment from './Types/Experiment.json';
import ExperimentalData from './Types/ExperimentalData.json';
import Attachment from './Types/Attachment.json';
import Component from './Types/Component.json';
import MapsTo from './Types/MapsTo.json';
import FunctionalComponent from './Types/FunctionalComponent.json';
import CombinatorialDerivation from './Types/CombinatorialDerivation.json';


const TypeToJson = {
  'http://sbols.org/v2#ComponentDefinition': ComponentDefinition,
  'http://sbols.org/v2#Collection': Collection,
  'http://sbols.org/v2#Sequence': Sequence,
  'http://sbols.org/v2#Model': Model,
  'http://sbols.org/v2#ModuleDefinition': ModuleDefinition,
  'http://sbols.org/v2#Implementation': Implementation,
  'http://sbols.org/v2#Range': Range,
  'http://sbols.org/v2#Experiment': Experiment,
  'http://sbols.org/v2#ExperimentalData': ExperimentalData,
  'http://sbols.org/v2#Attachment': Attachment,
  'http://sbols.org/v2#Component': Component,
  'http://sbols.org/v2#MapsTo': MapsTo,
  'http://sbols.org/v2#FunctionalComponent': FunctionalComponent,
  'http://sbols.org/v2#CombinatorialDerivation': CombinatorialDerivation
};

export default TypeToJson;
