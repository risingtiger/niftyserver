(() => {
  // ../../.nifty/files/lazy/components/pol/pol.js
  var ShapeE = function(ShapeE2) {
    ShapeE2[ShapeE2["NOT_APPLICABLE"] = 0] = "NOT_APPLICABLE";
    ShapeE2[ShapeE2["PRIORITY_MOBILE_FULL"] = 1] = "PRIORITY_MOBILE_FULL";
    ShapeE2[ShapeE2["PRIORITY_MOBILE_BOTTOM_HALF"] = 2] = "PRIORITY_MOBILE_BOTTOM_HALF";
    ShapeE2[ShapeE2["PRIORITY_MOBILE_BOTTOM_THIRD"] = 3] = "PRIORITY_MOBILE_BOTTOM_THIRD";
    ShapeE2[ShapeE2["PRIORITY_DESKTOP_MD"] = 4] = "PRIORITY_DESKTOP_MD";
    ShapeE2[ShapeE2["PRIORITY_DESKTOP_LG"] = 5] = "PRIORITY_DESKTOP_LG";
    ShapeE2[ShapeE2["PRIORITY_DESKTOP_XL"] = 6] = "PRIORITY_DESKTOP_XL";
    ShapeE2[ShapeE2["PRIORITY_DESKTOP_XXL"] = 7] = "PRIORITY_DESKTOP_XXL";
    ShapeE2[ShapeE2["XS"] = 8] = "XS";
    return ShapeE2;
  }(ShapeE || {});
  var DESKTOP_DEFAULT_WIDTH = 480;
  var DESKTOP_TO_MOBILE_DOWNSIZE_WIDTH = 390;
  var DESKTOP_DEFAULT_HEIGHT = 800;
  var DESKTOP_DEFAULT_TOP = 34;
  var MOBILE_DEFAULT_HALF_HEIGHT = 400;
  var MOBILE_DEFAULT_THIRD_HEIGHT = 200;
  var WINDOW_HEIGHT_PRIORITY_MOBILE_FULL = 0;
  var WINDOW_WIDTH_PRIORITY_MOBILE_FULL = 0;
  var WINDOW_HEIGHT_PRIORITY_MOBILE_BOTTOM_HALF = MOBILE_DEFAULT_HALF_HEIGHT;
  var WINDOW_WIDTH_PRIORITY_MOBILE_BOTTOM_HALF = 0;
  var WINDOW_HEIGHT_PRIORITY_MOBILE_BOTTOM_THIRD = MOBILE_DEFAULT_THIRD_HEIGHT;
  var WINDOW_WIDTH_PRIORITY_MOBILE_BOTTOM_THIRD = 0;
  var WINDOW_HEIGHT_PRIORITY_DESKTOP_MD = DESKTOP_DEFAULT_HEIGHT;
  var WINDOW_WIDTH_PRIORITY_DESKTOP_MD = DESKTOP_DEFAULT_WIDTH;
  var WINDOW_HEIGHT_PRIORITY_DESKTOP_LG = 1e3;
  var WINDOW_WIDTH_PRIORITY_DESKTOP_LG = 640;
  var WINDOW_HEIGHT_PRIORITY_DESKTOP_XL = 1200;
  var WINDOW_WIDTH_PRIORITY_DESKTOP_XL = 800;
  var WINDOW_HEIGHT_PRIORITY_DESKTOP_XXL = 1400;
  var WINDOW_WIDTH_PRIORITY_DESKTOP_XXL = 1024;
  var WINDOW_HEIGHT_XS = 350;
  var WINDOW_WIDTH_XS = 280;
  var CPOl = class extends HTMLElement {
    state;
    model;
    $;
    wrapperAnimation;
    slotAnimation;
    sheet;
    shadow;
    constructor() {
      super();
      this.state = { title: "", width: "", height: "", top: "", left: "", marginLeft: "", shape: 1, showHeader: true, isMinimizable: true, isMinimized: false, isMobileCentric: false };
      this.$ = this.querySelector;
      this.shadow = this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      this.state.title = this.getAttribute("title") || "";
      this.state.isMinimizable = this.getAttributeAsBoolean("minimizable", true);
      this.state.showHeader = this.getAttributeAsBoolean("showHeader", true);
      const child = this.firstElementChild;
      child.addEventListener("toggleCollapseExpand", () => {
        this.toggleCollapseExpand();
      });
      this.stateChange();
      if (child.tagName.startsWith("C-") || child.tagName.startsWith("VP-")) {
        child.addEventListener("hydrated", () => {
          this.onOpen();
        });
      } else {
        this.onOpen();
      }
    }
    disconnectedCallback() {
    }
    static get observedAttributes() {
      return ["minimize"];
    }
    toggleCollapseExpand() {
      if (this.state.isMinimized) {
        this.slotAnimation.reverse();
      } else {
        this.slotAnimation.playbackRate = 1;
        this.slotAnimation.currentTime = 0;
        this.slotAnimation.play();
      }
    }
    onCollapsed() {
    }
    onExpanded() {
    }
    getAttributeAsBoolean(name, def) {
      let value = this.getAttribute(name) || def;
      if (typeof value === "boolean") {
        return value;
      }
      value = String(value).trim().toLowerCase();
      if (["1", "true", "yes"].includes(value)) {
        return true;
      }
      if (["0", "false", "no"].includes(value)) {
        return false;
      }
      return def;
    }
    onOpen() {
      this.setupWindow();
      this.setupDom();
      this.setupAnimation();
      this.wrapperAnimation.addEventListener("finish", () => {
        this.onOpenAnimateFinished();
      });
      this.slotAnimation.addEventListener("finish", () => {
        this.state.isMinimized = !this.state.isMinimized;
        if (this.state.isMinimized) {
          this.onCollapsed();
        } else {
          this.onExpanded();
        }
        this.stateChange();
      });
      this.stateChange();
      this.setAttribute("opening", "true");
      this.animateShow();
    }
    onOpenAnimateFinished() {
      if (this.wrapperAnimation.playbackRate === -1) {
        this.removeAttribute("collapsing");
        this.removeAttribute("opened");
        this.setAttribute("collapsed", "true");
        this.dispatchEvent(new Event("collapsed"));
        return;
      }
      this.removeAttribute("opening");
      this.removeAttribute("collapsed");
      this.setAttribute("opened", "true");
    }
    setupWindow() {
      const WINDOW_INNER_WIDTH = window.innerWidth;
      const TOP = Number(this.getAttribute("top") || 0);
      const LEFT = Number(this.getAttribute("left") || 0);
      const WINDOW_DIMENSION = this.getSetupWindowDimension();
      if (WINDOW_DIMENSION.width) {
        this.state.left = LEFT ? `${LEFT}px` : "50%";
        this.state.marginLeft = `-${WINDOW_DIMENSION.width / 2}px`;
        this.state.width = `${WINDOW_DIMENSION.width}px`;
      } else {
        this.state.left = "0";
        this.state.width = "100%";
      }
      if (WINDOW_DIMENSION.height) {
        this.state.height = `${WINDOW_DIMENSION.height}px`;
        this.state.top = TOP ? `${TOP}px` : `${DESKTOP_DEFAULT_TOP}px`;
      } else {
        this.state.height = "100%";
        this.state.top = "0";
      }
      this.state.isMobileCentric = WINDOW_INNER_WIDTH < DESKTOP_DEFAULT_WIDTH;
    }
    getSetupWindowDimension() {
      const WINDOW_INNER_WIDTH = window.innerWidth;
      const SHAPE = Number(this.getAttribute("shape") || 0) || 1;
      const WIDTH = this.getAttribute("width") || 0;
      const HEIGHT = this.getAttribute("height") || 0;
      if (Number(WIDTH) > 0) {
        if (WINDOW_INNER_WIDTH < DESKTOP_DEFAULT_WIDTH) {
          return { height: 0, width: 0 };
        }
        return { height: Number(HEIGHT) || DESKTOP_DEFAULT_HEIGHT, width: Number(WIDTH) };
      }
      if ([1, 2, 3].includes(SHAPE)) {
        if (WINDOW_INNER_WIDTH >= DESKTOP_DEFAULT_WIDTH) {
          return { height: DESKTOP_DEFAULT_HEIGHT, width: DESKTOP_TO_MOBILE_DOWNSIZE_WIDTH };
        }
        switch (SHAPE) {
          case 1:
            return { height: WINDOW_HEIGHT_PRIORITY_MOBILE_FULL, width: WINDOW_WIDTH_PRIORITY_MOBILE_FULL };
          case 2:
            return { height: WINDOW_HEIGHT_PRIORITY_MOBILE_BOTTOM_HALF, width: WINDOW_WIDTH_PRIORITY_MOBILE_BOTTOM_HALF };
          case 3:
            return { height: WINDOW_HEIGHT_PRIORITY_MOBILE_BOTTOM_THIRD, width: WINDOW_WIDTH_PRIORITY_MOBILE_BOTTOM_THIRD };
        }
      }
      if ([4, 5, 6, 7].includes(SHAPE)) {
        if (WINDOW_INNER_WIDTH < DESKTOP_DEFAULT_WIDTH) {
          return { height: 0, width: 0 };
        }
        switch (SHAPE) {
          case 4:
            return { height: WINDOW_HEIGHT_PRIORITY_DESKTOP_MD, width: WINDOW_WIDTH_PRIORITY_DESKTOP_MD };
          case 5:
            return { height: WINDOW_HEIGHT_PRIORITY_DESKTOP_LG, width: WINDOW_WIDTH_PRIORITY_DESKTOP_LG };
          case 6:
            return { height: WINDOW_HEIGHT_PRIORITY_DESKTOP_XL, width: WINDOW_WIDTH_PRIORITY_DESKTOP_XL };
          case 7:
            return { height: WINDOW_HEIGHT_PRIORITY_DESKTOP_XXL, width: WINDOW_WIDTH_PRIORITY_DESKTOP_XXL };
        }
      }
      if (SHAPE === 8) {
        return { height: WINDOW_HEIGHT_XS, width: WINDOW_WIDTH_XS };
      }
      return { height: 0, width: 0 };
    }
    setupDom() {
      const wrapper = this.shadow.querySelector(".wrapper");
      wrapper.style.bottom = "0";
      wrapper.style.display = "block grid";
      wrapper.style.gridTemplateRows = "auto 1fr";
      wrapper.style.marginLeft = this.state.marginLeft;
      wrapper.style.maxHeight = this.state.height;
      wrapper.style.right = "0";
      wrapper.style.width = this.state.width;
      if (this.state.isMobileCentric) {
        wrapper.classList.add("mobile_centric");
      }
    }
    setupAnimation() {
      const WRAPPER = this.shadow.querySelector(".wrapper");
      const SLOT = WRAPPER.querySelector("header + *");
      const ANIMATIONS = this.getSetupAnimationAnimations();
      const TIMINGS = this.getSetupAnimationTimings();
      const ENV = this.state.isMobileCentric ? "mobile" : "desktop";
      this.wrapperAnimation = WRAPPER.animate(ANIMATIONS.get(`${ENV}_wrapper_fade_up`), TIMINGS.get("mobile_a"));
      this.wrapperAnimation.pause();
      this.slotAnimation = SLOT.animate(ANIMATIONS.get(`${ENV}_slot_collapse`), TIMINGS.get("mobile_a"));
      this.slotAnimation.pause();
    }
    getSetupAnimationAnimations() {
      const ANIMATIONS = /* @__PURE__ */ new Map();
      ANIMATIONS.set("mobile_wrapper_fade_up", [{ opacity: "0", transform: `translateY(${this.state.height})` }, { opacity: "1", transform: "translateY(0)" }]);
      ANIMATIONS.set("desktop_wrapper_fade_up", [{ opacity: "0", transform: `translateY(${this.state.height})` }, { opacity: "1", transform: "translateY(0)" }]);
      ANIMATIONS.set("desktop_slot_collapse", [{ maxHeight: `${this.state.height}` }, { maxHeight: "0" }]);
      ANIMATIONS.set("desktop_slot_expand", [{ maxHeight: "0" }, { maxHeight: `${this.state.height}` }]);
      return ANIMATIONS;
    }
    getSetupAnimationTimings() {
      const TIMINGS = /* @__PURE__ */ new Map();
      TIMINGS.set("mobile_a", { duration: 500, easing: "cubic-bezier(0.69, 0, 0.29, 1)", fill: "both", iterations: 1 });
      TIMINGS.set("dekstop_a", { duration: 1e3, easing: "cubic-bezier(0.69, 0, 0.29, 1)", fill: "both", iterations: 1 });
      return TIMINGS;
    }
    animateShow() {
      this.wrapperAnimation.playbackRate = 1;
      this.wrapperAnimation.currentTime = 0;
      this.wrapperAnimation.play();
    }
    stateChange() {
      render(this.template(this.state, this.model), this.shadow);
    }
    template(_state, _model) {
      return html`<style>:host {
	height: 100%;
	left: 0;
	pointer-events: none;
	position: absolute;
	top: 0;
	width: 100%;
	z-index: 1000;
}

.wrapper {
	background: white;
	border: 0px solid rgb(40 171 214 / 47%);
	border-radius: 8px 8px 0px 0px;
	box-shadow: 0 0 12px -4px rgba(0, 0, 0, 0.5);
	box-sizing: border-box;
	opacity: 0;
	pointer-events: all;
	position: absolute;
	z-index: 2;

	& header .collapse,
	& header .expand {
		display: none;
		height: 20px;
		width: 20px;
	}

	&.minimizable header {
		cursor: pointer;

		& .collapse,
		& .expand {
			display: block;
		}

		& .collapse {
			background: url("/assets/media/chevron_down.svg") center/20px no-repeat;
		}

		& .expand {
			background: url("/assets/media/chevron_up.svg") center/20px no-repeat;
		}
	}

	&.minimizable.collapsed header {
		& .collapse {
			display: none;
		}

		& .expand {
			display: block;
		}
	}

	&.minimizable.expanded header {
		& .collapsed {
			display: block;
		}

		& .expand {
			display: none;
		}
	}
}

.wrapper.mobile_centric {
	box-shadow: none;
}

.wrapper > header {
	box-sizing: border-box;
	display: flex;
	padding: 10px 12px;
	width: 100%;

	& .left {
		color: var(--actioncolor);
		display: block;
		font-family: var(--fontfamily);
		font-size: 16px;
		font-weight: 400;
		width: 20%;
	}

	& .middle {
		display: block;
		width: 60%;

		& h1 {
			color: var(--textcolor);
			font-family: var(--fontfamily);
			font-size: 18px;
			-webkit-font-smoothing: antialiased;
			font-weight: bold;
			margin: 0;
			padding: 0;
			text-align: center;
		}
	}

	& .right {
		color: var(--actioncolor);
		display: block;
		font-size: 16px;
		font-weight: 400;
		text-align: right;
		width: 20%;
	}
}

.wrapper > slot {
	display: block;
	overflow-y: auto;
}
</style><div class="wrapper ${_state.isMinimizable ? "minimizable" : ""} ${_state.isMinimized ? "collapsed" : "expanded"}">
	${_state.showHeader ? html`
	<header @click="${() => this.toggleCollapseExpand()}">
		<div class="left">${_state.isMinimizable ? html`
			<div class="collapse">
			</div>
			<div class="expand">
			</div>
		` : ""} <slot name="headerleft"></slot></div>
		<div class="middle"><h1>${_state.title}</h1></div>
		<div class="right">&nbsp;</div>
	</header>
	` : ""}
	<slot></slot>
</div>
`;
    }
  };
  customElements.define("c-pol", CPOl);
})();
