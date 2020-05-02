
/**
 * @namespace ContextualLayoutConfiguration
 * @description This object contains default configuration for contextual layout representations.
 *
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
  maxLayoutWidth: 1200,
  maxLayoutHeight: 800,
  translateX: -50,
  translateY: 0,
  animationSpeed: 300,
  hideOtherLayouts: false, // TODO:
  spacing: 16,
  renderingSize: "min",

  assignedFocusDistance: 800,
  riskFocusDistance: 500,
  childrenFocusDistance: 80,
  parentFocusDistance: 80,

  riskContainerNodeLimit: 3,
  riskContainerColumns: 2,
  riskContainderBorderRadius: 5,
  riskContainerBorderStrokeColor: "#888888cc",
  riskContainerBorderStrokeWidth: 1.85,
  riskContainerBackgroundColor: "#ff8e9e05",

  childContainerNodeLimit: 6,
  childContainerColumns: 3,
  childContainderBorderRadius: 5,
  childContainerBorderStrokeColor: "#888888cc",
  childContainerBorderStrokeWidth: 1.85,
  childContainerBackgroundColor: "#fff",

  parentContainerNodeLimit: 6,
  parentContainerColumns: 3,
  parentContainderBorderRadius: 5,
  parentContainerBorderStrokeColor: "#888888cc",
  parentContainerBorderStrokeWidth: 1.85,
  parentContainerBackgroundColor: "#fff",


}


export default ContextualLayoutConfiguration
