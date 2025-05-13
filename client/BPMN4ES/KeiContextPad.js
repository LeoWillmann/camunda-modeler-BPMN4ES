import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";

export default class KeiContextPad {
  constructor(
    config,
    contextPad,
    create,
    elementFactory,
    injector,
    translate,
    popupMenu
  ) {
    this._create = create;
    this._elementFactory = elementFactory;
    this._contextPad = contextPad;
    this._translate = translate;
    this._popupMenu = popupMenu;

    if (config.autoPlace !== false) {
      this._autoPlace = injector.get("autoPlace", false);
    }

    console.log("In the context pad constructor");
    contextPad.registerProvider(this);
  }

  getContextPadEntries(element) {
    console.log("getContextPadEntries", this._contextPad, this._popupMenu);
    // Only add the KEI menu item for tasks and subprocesses.
	//TODO bpmn has service tasks, script tasks, etc.
    // if ( isAny(element, [ 'bpmn:Task', 'bpmn:SubProcess' ]) ) { 
    if (true) {
      //if ( is(businessObject, 'bpmn:Task') || is(businessObject, 'bpmn:SubProcess') ) {
      const translate = this._translate;
      const contextPad = this._contextPad;
      const popupMenu = this._popupMenu;
      return {
        "add.kei": {
          group: "kei",
          className: "kei-icon-leaf",
          title: translate("Assign KEI"),
          html: '<div class="entry">!h</div>',
          action: {
            click: (event, element) => {
              const position = {
                ...getStartPosition(contextPad, element),
                cursor: {
                  x: event.x,
                  y: event.y,
                },
              };
              popupMenu.open(element, "kei-selector", position);
            },
          },
        },
      };
    } else {
      return {};
    }
  }
}

KeiContextPad.$inject = [
  "config",
  "contextPad",
  "create",
  "elementFactory",
  "injector",
  "translate",
  "popupMenu",
];

function getStartPosition(contextPad, elements) {
  const Y_OFFSET = 5;

  const pad = contextPad.getPad(elements).html;

  const padRect = pad.getBoundingClientRect();

  return {
    x: padRect.left,
    y: padRect.bottom,
  };
}
