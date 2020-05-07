
/**
 * @namespace ContextualLayoutConfiguration
 * @description This object contains default configuration for contextual layout representations.
 *
 * @category Layouts
 * @subcategory Customizations
 * @property {Number} layoutWidth=1200                            - The width used by the layout representation.
 * @property {Number} layoutHeight=800                            - The height used by the layout representation.
 * @property {Number} translateX=-50                              - Adds additional X translation for all SVG elements before rendering.
 * @property {Number} translateY=0                                - Adds additional Y translation for all SVG elements before rendering.
 * @property {Number} animationSpeed=300                          - Determines how fast SVG elements animates inside the current layout.
 * @property {Boolean} hideOtherLayouts=false                     - If set to true, other layouts are not visible.
 * @property {Number} spacing=32                                  - Determines the minimal spacing between nodes.
 * @property {String} renderingSize=min                           - Determines the node render representation. Available: "min" or "max".
 * @property {Number} assignedFocusDistance=800                   - Determines the distance between the assigned and focus node.
 * @property {Number} riskFocusDistance=500                       - Determines the distance between all risk nodes and focus node.
 * @property {Number} parentFocusDistance=80                      - Determines the distance between all parent nodes and focus node.
 * @property {Number} riskContainerNodeLimit=3                    - Limits how many nodes the risk container renderes.
 * @property {Number} riskContainerColumns=2                      - Limits how many columns the risk container has.
 * @property {Number} riskContainderBorderRadius=2                - Determines the containers border radius.
 * @property {String} riskContainerBorderStrokeColor=#888888cc    - Determines the containers border color.
 * @property {Number} riskContainerBorderStrokeWidth=1.85         - Determines the containers border width.
 * @property {String} riskContainerBackgroundColor=#ff8e9e05      - Determines the containers background color.
 * @property {Number} childContainerNodeLimit=6                   - Limits how many nodes the child container renderes.
 * @property {Number} childContainerColumns=3                     - Limits how many columns the child container has.
 * @property {Number} childContainderBorderRadius=5               - Determines the containers border radius.
 * @property {String} childContainerBorderStrokeColor=#888888cc   - Determines the containers border color.
 * @property {Number} childContainerBorderStrokeWidth=1.85        - Determines the containers border width.
 * @property {String} childContainerBackgroundColor=#fff          - Determines the containers background color.
 * @property {Number} parentContainerNodeLimit=6                  - Limits how many nodes the child container renderes.
 * @property {Number} parentContainerColumns=3                    - Limits how many columns the child container has.
 * @property {Number} parentContainderBorderRadius=5              - Determines the containers border radius.
 * @property {String} parentContainerBorderStrokeColor=#888888cc  - Determines the containers border color.
 * @property {Number} parentContainerBorderStrokeWidth=1.85       - Determines the containers border width.
 * @property {String} parentContainerBackgroundColor=#fff         - Determines the containers background color.
 */
const ContextualLayoutConfiguration = {

  layoutWidth: 1500,
  layoutHeight: 900,

  // assigned connection

  riskConnectionLineWidth: 20,
  riskConnectionArrowWidth: 30,
  riskConnectionarrowHeight: 25,
  riskConnectionOffset: 16,
  riskConnectionStrokeColor: "#ff8e9e",
  riskConnectionStrokeWidth: 1,
  riskConnectionStrokeDasharray: 0,
  riskConnectionColor: "#dd415bcc",
  riskConnectionLabelText: "Attached_Risks", // / must be seperated with _ to avoid new line creation
  riskConnectionLabelColor: "#ff8e9e",
  riskConnectionLabelFontFamily: "Montserrat",
  riskConnectionLabelFontSize: 16,
  riskConnectionLabelFontWeight: 600,
  riskConnectionLabelFontStyle: "normal",
  riskConnectionLabelBackground: "#ffffffcc",


  // child container

  childContainerNodeLimit: 6,
  childContainerColumns: 3,
  childContainerBorderRadius: 5,
  childContainerBorderStrokeColor: "#75f",
  childContainerBorderStrokeWidth: 1.25,
  childContainerBackgroundColor: "#fff",


  // parent container

  parentContainerNodeLimit: 6,
  parentContainerColumns: 3,
  parentContainerBorderRadius: 5,
  parentContainerBorderStrokeColor: "#f75",
  parentContainerBorderStrokeWidth: 1.25,
  parentContainerBackgroundColor: "#fff",


  // risk container

  riskContainerNodeLimit: 4,
  riskContainerColumns: 2,
  riskContainerBorderRadius: 5,
  riskContainerBorderStrokeColor: "#dd415bcc",
  riskContainerBorderStrokeWidth: 1.25,
  riskContainerBackgroundColor: "#ff8e9e05",

  riskNodeConnectionStrokeWidth: 2,
  riskNodeConnectionStrokeColor: "#dd415bcc",
  riskNodeConnectionStrokeDasharray: "10 5",

  // generall container
  containerConnectionLineWidth: 25,
  containerConnectionArrowWidth: 25,
  containerConnectionarrowHeight: 25,
  containerConnectionStrokeColor: "inherit", // #cccccc, inherit
  containerConnectionStrokeWidth: 1,
  containerConnectionStrokeDasharray: 0,
  containerConnectionColor: "inherit", // #cccccc


  // distances between nodes
  focusXShift: -200,
  riskFocusDistance: 617.5,
  riskConnectionDistance: 75,
  childrenFocusDistance: 80,
  parentFocusDistance: 80,


  // expander
  expanderTextColor: "#222",
  expanderFontFamily: "Montserrat",
  expanderFontSize: 12,
  expanderFontWeight: 600,
  expanderFontStyle: "normal",
  expanderTextBackground: "#fff",
  showParentExpander: true,
  showChildExpander: true,
  showRiskExpander: true,


  // maxLayoutWidth: 1200,
  // maxLayoutHeight: 800,
  translateX: -50,
  translateY: 0,
  animationSpeed: 1300,
  spacing: 16,
  renderingSize: "min",


}


export default ContextualLayoutConfiguration
