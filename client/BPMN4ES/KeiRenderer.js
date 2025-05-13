import BaseRenderer from "diagram-js/lib/draw/BaseRenderer";
import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
} from "tiny-svg";
import { getRoundRectPath } from "bpmn-js/lib/draw/BpmnRenderUtil";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import { getExtensionElement, hasExtensionElement } from "./util.js";

const HIGH_PRIORITY = 1500;
const TASK_BORDER_RADIUS = 2;

// The amount of space between the BPMN element and the bounding box of the KEI.
const KEI_SPACING = 30;

// The size of the indicator icon in pixels.
const ICON_SIZE = 30;

export default class KeiRenderer extends BaseRenderer {
  constructor(eventBus, bpmnRenderer, KeiContextPad) {
    super(eventBus, HIGH_PRIORITY);
    this.bpmnRenderer = bpmnRenderer;
    this.customContextPad = KeiContextPad; // Store the CustomContextPad instance
    console.log("In the KEI renderer constructor");
  }

  canRender(element) {
    const businessObject = getBusinessObject(element);
    console.log("businessObject {}", businessObject);

    // only render tasks and subprocesses with KEIs.
    return (
      isAny(element, ["bpmn:Task", "bpmn:SubProcess"]) &&
      !element.labelTarget &&
      hasExtensionElement(businessObject, "bpmn4es:environmentalIndicators")
    );
  }

  // TODO: Place the icon in the middle if there is no target value to display.
  drawShape(parentNode, element) {
    const businessObject = getBusinessObject(element);

    let environmentalIndicators = getExtensionElement(
      businessObject,
      "bpmn4es:environmentalIndicators"
    );
    const indicator = environmentalIndicators.indicators[0];

    // TODO: Adjust width of the box based on width of the text of the target value.
    const dimensions = this.computeBBoxDimensions(indicator);

    // Create the element for the bounding box of the KEI.
    const bbox = this.createBBox(element, dimensions);

    // Create the element for the icon of the KEI.
    const icon = this.createIcon(element, indicator, bbox);

    // Create the line that connects the BPMN element to the KEI.
    const line = this.createLine(element);

    // Draw the elements in reverse order to ensure that the line sits behind the BPMN element and KEI box
    // and that the icon and text are placed on top of the KEI box.
    svgAppend(parentNode, line);
    svgAppend(parentNode, bbox);
    svgAppend(parentNode, icon);

    if (indicator.targetValue) {
      const text = this.createTargetValueText(element, indicator);
      svgAppend(parentNode, text);
    }

    return this.bpmnRenderer.drawShape(parentNode, element);
  }

  createTargetValueText(element, indicator) {
    const text = svgCreate("text");
    svgAttr(text, {
      x: element.width / 2,
      y: -KEI_SPACING - 12,
      "font-size": "12px",
      "font-family": "Arial, sans-serif",
      fill: "#000000",
      opacity: 1,
      "text-anchor": "middle", // Center the text
    });
    text.textContent = indicator.targetValue + " " + indicator.unit;

    return text;
  }

  createLine(element) {
    const line = svgCreate("line");
    svgAttr(line, {
      x1: element.width / 2, // Start point
      y1: 0, // Start point
      x2: element.width / 2, // End point
      y2: -KEI_SPACING, // End point
      stroke: "#000", // Line color
      "stroke-width": "1", // Line thickness
      "stroke-dasharray": "5, 5", // 5px dash, 5px gap
    });

    return line;
  }

  createIcon(element, indicator, bbox) {
    const height = Number(svgAttr(bbox, "height"));
    const y = Number(svgAttr(bbox, "y"));

    let offset = (height - ICON_SIZE) / 2;

    if (indicator.targetValue) {
      offset = 8;
    }

    // A text box for the icon, which is embedded in a font.
    const icon = svgCreate("text");
    svgAttr(icon, {
      x: element.width / 2, // Place the icon in the middle of the rectangle.
      y: y + ICON_SIZE + offset, //-bbox.height - KEI_SPACING + ICON_SIZE + 7, // Place the icon near the top.
      "font-size": ICON_SIZE + "px",
      class: "material-symbols-outlined",
      "text-anchor": "middle", // Center the text
    });
    icon.textContent = indicator.icon; // The extension element itself carries the content that needs to be placed here in order to render the icon.

    return icon;
  }

  computeBBoxDimensions(indicator) {
    // Make the bounding box slightly taller if a target value needs to be rendered.
    if (indicator.targetValue) {
      return { width: 60, height: 70 };
    } else {
      return { width: 50, height: 50 };
    }
  }

  // Create the bounding box for the KEI that is placed above the BPMN element.
  createBBox(element, dimensions) {
    const rect = svgCreate("rect");
    svgAttr(rect, {
      x: element.width / 2 - dimensions.width / 2,
      y: -dimensions.height - KEI_SPACING,
      width: dimensions.width,
      height: dimensions.height,
      fill: "#ffffff",
      stroke: "#000000",
    });

    return rect;
  }

  getShapePath(shape) {
    if (is(shape, "bpmn:Task") || is(shape, "bpmn:SubProcess")) {
      return getRoundRectPath(shape, TASK_BORDER_RADIUS);
    }
    return this.bpmnRenderer.getShapePath(shape);
  }
}

KeiRenderer.$inject = ["eventBus", "bpmnRenderer"];
