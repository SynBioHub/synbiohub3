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
import Module from './Types/Module.json';
import Interaction from './Types/Interaction.json';
import Participation from './Types/Participation.json';
import SequenceConstraint from './Types/SequenceConstraint.json';
import Datasheet from './Types/Datasheet.json';
import Plan from './Types/Plan.json';
import VariableComponent from './Types/VariableComponent.json';
import SequenceAnnotation from './Types/SequenceAnnotation.json';
import Activity from './Types/Activity.json';
import Usage from './Types/Usage.json';
import Association from './Types/Association.json';
import Agent from './Types/Agent.json';
import GenericLocation from './Types/GenericLocation.json';
import Cut from './Types/Cut.json';
import Sequence3 from './Types/Sequence3.json';
import Component3 from './Types/Component3.json';
import Feature3 from './Types/Feature3.json';
import ComponentReference3 from './Types/ComponentReference3.json';
import SubComponent3 from './Types/SubComponent3.json';
import LocalSubComponent3 from './Types/LocalSubComponent3.json';


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
  'http://sbols.org/v2#CombinatorialDerivation': CombinatorialDerivation,
  'http://sbols.org/v2#Module': Module,
  'http://sbols.org/v2#Interaction': Interaction,
  'http://sbols.org/v2#Participation': Participation,
  'http://sbols.org/v2#SequenceConstraint': SequenceConstraint,
  'http://sbols.org/v2#VariableComponent': VariableComponent,
  'http://sbols.org/v2#SequenceAnnotation': SequenceAnnotation,
  'http://sbols.org/v2#GenericLocation': GenericLocation,
  'http://sbols.org/v2#Cut': Cut,
  'http://www.myapp.org/Datasheet': Datasheet,
  'http://www.w3.org/ns/prov#Plan' : Plan,
  'http://www.w3.org/ns/prov#Activity': Activity,
  'http://www.w3.org/ns/prov#Usage': Usage,
  'http://www.w3.org/ns/prov#Association': Association,
  'http://www.w3.org/ns/prov#Agent': Agent,
  'http://sbols.org/v3#Sequence': Sequence3,
  'http://sbols.org/v3#Component': Component3,
  'http://sbols.org/v3#Feature': Feature3,
  'http://sbols.org/v3#ComponentReference': ComponentReference3,
  'http://sbols.org/v3#SubComponent': SubComponent3,
  'http://sbols.org/v3#LocalSubComponent': LocalSubComponent3

};

export default TypeToJson;
