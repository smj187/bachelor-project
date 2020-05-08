
/**
 * @namespace ContextualLayoutConfiguration
 * @description This object contains default configuration for contextual layout representations.
 *
 * @category Layouts
 * @subcategory Customizations
 * @property {Number} layoutHeight=900                            - The height used by the layout representation.
 *
 * @property {Number} riskConnectionLineWidth=20                  - Determines the thickness of the arrow.
 * @property {Number} riskConnectionArrowWidth=30                 - Determines how long the arrow head appears.
 * @property {Number} riskConnectionarrowHeight=25                - Determines the thickness of the arrow head.
 * @property {Number} riskConnectionOffset=16                     - Determines the offset between the nodes the arrow connections.
 * @property {String} riskConnectionStrokeColor=#ff8e9e           - Determines the arrows color.
 * @property {Number} riskConnectionStrokeWidth=1                 - Determines the arrows stroke width.
 * @property {Number} riskConnectionStrokeDasharray=0             - Determines the arrows dash array.
 * @property {String} riskConnectionColor=#dd415bcc               - Determines the default arrow fill color.
 * @property {Number} riskConnectionLabelTranslateX=0             - Determines the horizontal adjustment for the label.
 * @property {Number} riskConnectionLabelTranslateY=0             - Determines the vertical adjustment for the label.
 * @property {String} riskConnectionLabelText=Attached_Risks      - Determines the text. Note: the label must be seperated with _ to avoid new line creation.
 * @property {String} riskConnectionLabelColor=#ff8e9e            - Determines the color for the label.
 * @property {String} riskConnectionLabelFontFamily=Montserrat    - Determines the font family for the label.
 * @property {Number} riskConnectionLabelFontSize=16              - Determines the font size for the label.
 * @property {Number} riskConnectionLabelFontWeight=600           - Determines the font weight for the label.
 * @property {String} riskConnectionLabelFontStyle=normal         - Determines the font style for the label.
 * @property {String} riskConnectionLabelBackground=#ffffffcc     - Determines the background color for the label.
 *
 * @property {Number} childContainerNodeLimit=6                   - Limits how many nodes the child container renderes.
 * @property {Number} childContainerColumns=3                     - Limits how many columns the child container has.
 * @property {Number} childContainderBorderRadius=5               - Determines the containers border radius.
 * @property {String} childContainerBorderStrokeColor=#888888cc   - Determines the containers border color.
 * @property {Number} childContainerBorderStrokeWidth=1.25        - Determines the containers border width.
 * @property {String} childContainerBackgroundColor=#ffffff       - Determines the containers background color.
 *
 * @property {Number} parentContainerNodeLimit=6                  - Limits how many nodes the parent container renderes.
 * @property {Number} parentContainerColumns=3                    - Limits how many columns the parent container has.
 * @property {Number} parentContainderBorderRadius=5              - Determines the containers border radius.
 * @property {String} parentContainerBorderStrokeColor=#888888cc  - Determines the containers border color.
 * @property {Number} parentContainerBorderStrokeWidth=1.25       - Determines the containers border width.
 * @property {String} parentContainerBackgroundColor=#ffffff      - Determines the containers background color.
 *
 * @property {Number} assignedParentContainerNodeLimit=6                - Limits how many nodes the assigned parent container renderes.
 * @property {Number} assignedParentContainerColumns=3                  - Limits how many columns the assigned parent container has.
 * @property {Number} assignedParentContainerBorderRadius=5             - Determines the containers border radius.
 * @property {String} assignedParentContainerBorderStrokeColor=#7daed6  - Determines the containers border color.
 * @property {Number} assignedParentContainerBorderStrokeWidth=3        - Determines the containers border width.
 * @property {String} assignedParentContainerBackgroundColor=#ffffff    - Determines the containers background color.
 * @property {Boolean} showAssignedParentNodes=true                     - Determines if the assigned parent nodes are visible.
 * @property {Boolean} showAssignedParentExpander=true                  - Determines if the assigned parent container has a visible expander.
 * @property {Number} assignedParentConnectionDistance=200              - Determines the containers background color.
 *
 * @property {Number} assignedChildContainerNodeLimit=6                 - Limits how many nodes the assigned child container renderes.
 * @property {Number} assignedChildContainerColumns=3                   - Limits how many columns the assigned child container has.
 * @property {Number} assignedChildContainerBorderRadius=5              - Determines the containers border radius.
 * @property {String} assignedChildContainerBorderStrokeColor=#7daed6   - Determines the containers border color.
 * @property {Number} assignedChildContainerBorderStrokeWidth=3         - Determines the containers border width.
 * @property {String} assignedChildContainerBackgroundColor=#ffffff      - Determines the containers background color.
 * @property {Boolean} showAssignedChildNodes=true                      - Determines if the assigned child nodes are visible.
 * @property {Boolean} showAssignedChildExpander=true                   - Determines if the assigned child container has a visible expander.
 * @property {Number} assignedChildConnectionDistance=200               - Determines the containers background color.
 *
 *
 * @property {Number} riskContainerNodeLimit=4                    - Limits how many nodes the risk container renderes.
 * @property {Number} riskContainerColumns=2                      - Limits how many columns the risk container has.
 * @property {Number} riskContainderBorderRadius=5                - Determines the containers border radius.
 * @property {String} riskContainerBorderStrokeColor=#dd415bcc    - Determines the containers border color.
 * @property {Number} riskContainerBorderStrokeWidth=1.25         - Determines the containers border width.
 * @property {String} riskContainerBackgroundColor=#ff8e9e05      - Determines the containers background color.
 * @property {Number} riskNodeConnectionStrokeWidth=2             - Determines the stroke width of the connection between risks and the assigned connection.
 * @property {String} riskNodeConnectionStrokeColor=#dd415bcc     - Determines the stroke color of the connection between risks and the assigned connection.
 * @property {String} riskNodeConnectionStrokeDasharray="5"       - Determines the dash array of the connection between risks and the assigned connection.
 *
 * @property {Number} containerConnectionLineWidth=25             - Determines the thickness of the container connection.
 * @property {Number} containerConnectionArrowWidth=25            - Determines the arrow width of the container connection.
 * @property {Number} containerConnectionarrowHeight=25           - Determines the arrow height of the container connection.
 * @property {String} containerConnectionStrokeColor=inherit      - Determines the default arrow fill color. Available: "inherit" or hex value as String.
 * @property {Number} containerConnectionStrokeWidth=1            - Determines the stroke width of the container connection.
 * @property {String} containerConnectionStrokeDasharray="0"      - Determines the dash arrow of the container connection.
 * @property {String} containerConnectionColor=inherit            - Determines the default arrow fill color. Available: "inherit" or hex value as String.
 *
 * @property {Number} focusXShift=200                             - Determines how much the focus node is shifted on the X axis.
 * @property {Number} riskFocusDistance=506                       - Determines the distance between risks nodes and focus node.
 * @property {Number} riskConnectionDistance=75                   - Determines the distance between risk nodes and the assigned connection.
 * @property {Number} childrenFocusDistance=80                    - Determines the distance between child nodes and focus node.
 * @property {Number} parentFocusDistance=80                      - Determines the distance between parent nodes and focus node.
 * @property {Number} focusAssignedDistance=900                   - Determines the distance between the focus and main assigned node.
 *
 * @property {String} expanderTextColor=#222                      - Determines the color for the text.
 * @property {String} expanderFontFamily=Montserrat               - Determines the font family for the text.
 * @property {String} expanderFontSize=12                         - Determines the font size for the text.
 * @property {String} expanderFontWeight=600                      - Determines the font weight for the text.
 * @property {String} expanderFontStyle=normal                    - Determines the font style for the text.
 * @property {String} expanderTextBackground=#ccc                 - Determines the background color for the text.
 * @property {Boolean} showParentExpander=true                    - Determines if the parent container has a visible expander.
 * @property {Boolean} showChildExpander=true                     - Determines if the child container has a visible expander.
 * @property {Boolean} showRiskExpander=true                      - Determines if the risk container has a visible expander.
 *
 * @property {Number} translateX=0                                - Adds additional X translation for all SVG elements before rendering.
 * @property {Number} translateY=0                                - Adds additional Y translation for all SVG elements before rendering.
 * @property {Number} animationSpeed=300                          - Determines how fast SVG elements animates inside the current layout.
 * @property {Number} contextualNodeSpacing=16                    - Determines the minimal spacing between nodes.
 * 
 * @property {Boolean} showAssignedConnection=true                - Determines if the assigned connection information is visible.
 */
const ContextualLayoutConfiguration = {

  layoutHeight: 900,

  // assigned node connection

  riskConnectionLineWidth: 20,
  riskConnectionArrowWidth: 30,
  riskConnectionarrowHeight: 25,
  riskConnectionOffset: 16,
  riskConnectionStrokeColor: "#ff8e9e",
  riskConnectionStrokeWidth: 1,
  riskConnectionStrokeDasharray: 0,
  riskConnectionColor: "#dd415bcc",
  riskConnectionLabelTranslateX: 0,
  riskConnectionLabelTranslateY: 0,
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
  childContainerBorderStrokeColor: "#888888cc",
  childContainerBorderStrokeWidth: 1.25,
  childContainerBackgroundColor: "#ffffff",


  // parent container

  parentContainerNodeLimit: 6,
  parentContainerColumns: 3,
  parentContainerBorderRadius: 5,
  parentContainerBorderStrokeColor: "#888888cc",
  parentContainerBorderStrokeWidth: 1.25,
  parentContainerBackgroundColor: "#ffffff",


  // assigned parents container
  assignedParentContainerNodeLimit: 6, // limits how many nodes are visible within the container
  assignedParentContainerColumns: 3,
  assignedParentContainerBorderRadius: 5,
  assignedParentContainerBorderStrokeColor: "#7daed6",
  assignedParentContainerBorderStrokeWidth: 3,
  assignedParentContainerBackgroundColor: "#ffffff",
  showAssignedParentNodes: true,
  showAssignedParentExpander: true,
  assignedParentConnectionDistance: 200,


  // assigned child container
  assignedChildContainerNodeLimit: 6,
  assignedChildContainerColumns: 3,
  assignedChildContainerBorderRadius: 15,
  assignedChildContainerBorderStrokeColor: "#7daed6",
  assignedChildContainerBorderStrokeWidth: 3,
  assignedChildContainerBackgroundColor: "#ffffff",
  showassignedChildNodes: true,
  showassignedChildExpander: true,
  assignedChildConnectionDistance: 200,

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
  containerConnectionStrokeDasharray: "0",
  containerConnectionColor: "inherit", // #cccccc


  // distances between nodes
  focusXShift: 300,
  riskFocusDistance: 506,
  riskConnectionDistance: 75,
  childrenFocusDistance: 80,
  parentFocusDistance: 80,
  focusAssignedDistance: 900,


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


  translateX: 0,
  translateY: 0,
  animationSpeed: 300,
  contextualNodeSpacing: 16,

  showAssignedConnection: true,
}


export default ContextualLayoutConfiguration
