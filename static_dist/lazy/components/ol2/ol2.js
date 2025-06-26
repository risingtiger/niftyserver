(() => {
  // ../../.nifty/files/lazy/components/ol2/ol2.js
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
  var COl2 = class extends HTMLElement {
    s;
    m;
    $;
    wrapperAnimation;
    backgroundAnimation;
    viewAnimation;
    viewheaderAnimation;
    sheet;
    shadow;
    static get observedAttributes() {
      return ["close"];
    }
    constructor() {
      super();
      this.s = { title: "", width: "", height: "", top: "", left: "", margin_left: "", shape: 1, show_closebtn: true, show_header: true, is_mobile_centric: false };
      this.$ = this.querySelector;
      this.shadow = this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      this.s.title = this.getAttribute("title") || "asdfsdf";
      this.s.show_closebtn = this.getAttribute("closebtn") === "false" ? false : true;
      this.s.show_header = this.getAttribute("showheader") === "false" ? false : true;
      const child = this.firstElementChild;
      child.addEventListener("close", () => {
        this.close();
      });
      this.sc();
      if (child.tagName.startsWith("C-") || child.tagName.startsWith("VP-")) {
        child.addEventListener("hydrated", continue_to_open.bind(this));
      } else {
        continue_to_open.bind(this)();
      }
      function continue_to_open() {
        this.sc();
        setTimeout(() => {
          this.scrollTop = this.scrollHeight / 2;
        }, 200);
      }
      function animate_finished() {
        if (this.wrapperAnimation.playbackRate === -1) {
          this.removeAttribute("closing");
          this.removeAttribute("opened");
          this.setAttribute("closed", "true");
          this.dispatchEvent(new Event("close"));
        } else {
          this.removeAttribute("opening");
          this.removeAttribute("closed");
          this.setAttribute("opened", "true");
        }
      }
    }
    async attributeChangedCallback(name) {
      if (name === "close") {
        this.close();
      }
    }
    sc() {
      render(this.template(this.s, this.m), this.shadow);
    }
    close() {
      this.setAttribute("closing", "true");
      animate_out(this.backgroundAnimation, this.viewAnimation, this.viewheaderAnimation, this.wrapperAnimation);
    }
    setup_animations_etc() {
      let elW = this.shadow.querySelector(".wrapper");
      let elB = this.shadow.querySelector(".backgroundcover");
      let elC = document.querySelector("#views .view").shadowRoot.querySelector(".content");
      let elCH = document.querySelector("#views .view").shadowRoot.querySelector("header");
      this.backgroundAnimation = elB.animate(ol_animations.get("background_fade_in"), ol_timings.get("mobile_a"));
      this.backgroundAnimation.pause();
      this.viewAnimation = elC.animate(ol_animations.get(`${this.s.is_mobile_centric ? "mobile" : "desktop"}_view_slide_down`), ol_timings.get("mobile_a"));
      this.viewAnimation.pause();
      this.viewheaderAnimation = elCH.animate(ol_animations.get(`${this.s.is_mobile_centric ? "mobile" : "desktop"}_view_slide_down`), ol_timings.get("mobile_a"));
      this.viewheaderAnimation.pause();
      this.wrapperAnimation = elW.animate(ol_animations.get(`${this.s.is_mobile_centric ? "mobile" : "desktop"}_wrapper_fade_up`), ol_timings.get("mobile_a"));
      this.wrapperAnimation.pause();
    }
    setup_pos_size_etc() {
      const ww = window.innerWidth;
      const pb = this.getAttribute("shape") || "0";
      const pw = this.getAttribute("width") || "0";
      const ph = this.getAttribute("height") || "0";
      const pt = this.getAttribute("top") || "0";
      const pl = this.getAttribute("left") || "0";
      const shape = Number(pb) || 1;
      let width = Number(pw);
      let height = Number(ph);
      let width_num = 0;
      let height_num = 0;
      let top = Number(pt);
      let left = Number(pl);
      const DESKTOP_DEFAULT_WIDTH = 480;
      const DESKTOP_TO_MOBILE_DOWNSIZE_WIDTH = 390;
      const DESKTOP_DEFAULT_HEIGHT = 800;
      const DESKTOP_DEFAULT_TOP = 34;
      const MOBILE_DEFAULT_HALF_HEIGHT = 400;
      const MOBILE_DEFAULT_THIRD_HEIGHT = 200;
      if (width > 0) {
        if (ww < DESKTOP_DEFAULT_WIDTH) {
          width = 0;
          height = 0;
        } else {
          width = Number(pw);
          height = height || DESKTOP_DEFAULT_HEIGHT;
        }
      } else if (shape === 1 || shape === 2 || shape === 3) {
        if (ww < DESKTOP_DEFAULT_WIDTH) {
          width = 0;
          if (shape === 1) {
            height = 0;
          } else if (shape === 2) {
            height = MOBILE_DEFAULT_HALF_HEIGHT;
          } else if (shape === 3) {
            height = MOBILE_DEFAULT_THIRD_HEIGHT;
          }
        } else {
          width = DESKTOP_TO_MOBILE_DOWNSIZE_WIDTH;
          height = DESKTOP_DEFAULT_HEIGHT;
        }
      } else if (shape === 4 || shape === 5 || shape === 6 || shape === 7) {
        if (ww < DESKTOP_DEFAULT_WIDTH) {
          width = 0;
          height = 0;
        } else {
          if (shape === 4) {
            width = DESKTOP_DEFAULT_WIDTH;
            height = DESKTOP_DEFAULT_HEIGHT;
          } else if (shape === 5) {
            width = 640;
            height = 1e3;
          } else if (shape === 6) {
            width = 800;
            height = 1200;
          } else if (shape === 7) {
            width = 1024;
            height = 1400;
          }
        }
      } else if (shape === 8) {
        width = 280;
        height = 550;
      }
      if (width === 0) {
        this.s.width = "100%";
        this.s.left = "0";
      } else {
        this.s.width = width + "px";
        this.s.left = left ? left + "px" : "50%";
        this.s.margin_left = "-" + width / 2 + "px";
      }
      if (height === 0) {
        this.s.height = "100%";
        this.s.top = "0";
      } else {
        this.s.height = height + "px";
        this.s.top = top ? top + "px" : DESKTOP_DEFAULT_TOP + "px";
      }
      this.s.is_mobile_centric = ww < DESKTOP_DEFAULT_WIDTH ? true : false;
    }
    setup_dom() {
      const wrapper_el = this.shadow.querySelector(".wrapper");
      wrapper_el.style.width = this.s.width;
      wrapper_el.style.maxHeight = this.s.height;
      wrapper_el.style.height = this.s.height;
      wrapper_el.style.top = this.s.top;
      wrapper_el.style.left = this.s.left;
      wrapper_el.style.marginLeft = this.s.margin_left;
      wrapper_el.style.display = "block grid";
      wrapper_el.style.gridTemplateRows = "auto 1fr";
      if (this.s.is_mobile_centric) {
        wrapper_el.classList.add("mobile_centric");
      }
    }
    template = (_s, _m) => {
      return html`<style>

:host {
	position: fixed; /* Fixed position relative to the viewport */
	top: 0;      /* Position top 50% of viewport height *above* the viewport top */
	left: 0;
	width: 100vw;    /* Full viewport width */
	height: 100vh;   /* Twice the viewport height */
	overflow-y: scroll; /* Allow vertical scrolling within the overlay */
	scroll-snap-type: y mandatory; /* Enable vertical scroll snapping */
	/* .overlay-content is positioned absolutely relative to this */
	scrollbar-width: none;
	scroll-behavior:  smooth; /* Smooth scrolling behavior */
	z-index: 10000;

}
:host::-webkit-scrollbar {
	display: none; /* For Chrome, Safari, and Opera */
}

.spacer {
	height: 100vh;
	scroll-snap-align: start; /* Snap to the start of this element */
	/* This element is intentionally blank and transparent, acting as a scroll buffer */
}


.wrapper {
	position: relative; /* Changed from absolute */
	height: 100vh;      /* Explicit height */
	overflow-y: hidden;
	scroll-snap-align: start; /* Snap to the start of this element */
	padding: 45px 0 0 0;
	box-sizing: border-box; /* Include padding in height calculation */
	display: block;



	/*
    position: absolute;
    border-radius: 8px 8px 0px 0px;
    border: 0px solid rgb(40 171 214 / 47%);
    box-shadow: 0 0 12px -4px rgba(0, 0, 0, 0.5);
    opacity: 0;
    box-sizing: border-box;
    background: white;
    box-sizing: border-box;
    z-index: 2;
*/
}


.content {
	position: relative; /* Changed from absolute */
	background-color: white;
	padding: 30px;
	box-sizing: border-box; /* Include padding in height calculation */
	height: calc(100vh - 45px); /* Full height minus the top padding */
	 /* Vertically center content */
	 /* Horizontally center content if it's not full width */
	border-radius: 8px 8px 0px 8px;
	
	 /* Example minimum width */
	box-shadow: 0 4px 14px 0px rgb(0 0 0 / 19%); /* A subtle shadow for depth */
}

.content > header {
    display: flex;
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;

    & .left {
        display: block;
        width: 20%;
        font-family: var(--fontfamily);
        font-size: 16px;
        font-weight: 400;
        color: var(--actioncolor);
        cursor: pointer;

		a {
			-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
		}

    }

    & .middle {
        display: block;
        width: 60%;

        & h1 {
			font-family: var(--fontfamily);
			-webkit-font-smoothing: antialiased;
			color: var(--textcolor);	
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            padding: 0;
            margin: 0;
        }
    }

    & .right {
        display: block;
        width: 20%;
        font-size: 16px;
        font-weight: 400;
        text-align: right;
        color: var(--actioncolor);
    }
}

.content > slot {
    display: block;
    overflow-y: auto;
}






/* :host { */
/*     position: absolute; */
/*     width: 100%; */
/*     height: 100%; */
/*     top: 0; */
/*     left: 0; */
/*     z-index: 1000; */
/* } */

/*
.scrollcontainer {
    position: absolute;
    width: 100%;
    top: 0;
    left: 0;
    overflow-y: hidden;
    height: 200%;
    z-index: 2;
    scroll-snap-type: y mandatory;
}
.scrollcontainer.scrollmode {
	overflow-y: scroll;

	> .wrapper {
		top: 50% !important;
		z-index: 2;
	}

	.emptyspace {top: 0%;background: #7600ff4d;}

	.snapel {
		scroll-snap-align: start;
	}
}
*/


/*
.emptyspace {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	z-index: 1;
}


.wrapper {
    position: absolute;
    border-radius: 8px 8px 0px 0px;
    border: 0px solid rgb(40 171 214 / 47%);
    box-shadow: 0 0 12px -4px rgba(0, 0, 0, 0.5);
    opacity: 0;
    box-sizing: border-box;
    background: white;
    box-sizing: border-box;
    z-index: 2;
}
.wrapper.mobile_centric {
    box-shadow: none;
    height: 100%;
}
*/


/*
.backgroundcover {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 1;
    opacity: 0;
    /*will-change: opacity; /* Prevents flicker in Safari 
    /*background-color: #00000036;
    /* background-color: #00000036; 
    /* background-color: rgba(255, 255, 255, 0.9); 
}
*/




</style>

<!--

<div 

    class="wrapper 

        ${_s.iswrapper_full_width ? "fullwidth" : ""} 
        ${_s.wrapper_round_bottom_corners ? "roundbottom" : ""}" 

    style="
        ${"width:" + _s.width + ";"} 
        ${"height:" + _s.height + ";"} 
        ${"left:" + _s.left + ";"} 
        ${"top:" + _s.top + ";"} 
        ${_s.margin_left ? "margin-left:" + _s.margin_left : ""}">

-->
<div class="spacer">&nbsp;</div>
<div class="wrapper">
	<div class="content">
		${_s.show_header ? html`
		<header>
			<div class="left">${_s.show_closebtn ? html`<a @click="${() => this.close()}">close</a>` : ""} <slot name="headerleft"></slot></div>
			<div class="middle"><h1>${_s.title}</h1></div>
			<div class="right">&nbsp;</div>
		</header>
		` : ""}
		<slot></slot>
	</div>
</div>
`;
    };
  };
  customElements.define("c-ol2", COl2);
  function animate_out(backgroundAnimation, viewAnimation, viewheaderAnimation, wrapperAnimation) {
    backgroundAnimation.reverse();
    viewAnimation.reverse();
    viewheaderAnimation.reverse();
    wrapperAnimation.reverse();
  }
  var ol_animations = /* @__PURE__ */ new Map();
  ol_animations.set("mobile_wrapper_fade_up", [{ opacity: "0", transform: `translate3d(0, 44px, 0)` }, { opacity: "1", transform: "translate3d(0, 0, 0)" }]);
  ol_animations.set("desktop_wrapper_fade_up", [{ opacity: "0", transform: `translate3d(0, 19px, 0)` }, { opacity: "1", transform: "translate3d(0, 0, 0)" }]);
  ol_animations.set("mobile_view_slide_down", [{ transform: `scale(1) translate3d(0, 0px, 0)` }, { transform: "scale(0.9) translate3d(0, 28px, 0)" }]);
  ol_animations.set("desktop_view_slide_down", [{ transform: `scale(1) translate3d(0, 0px, 0)` }, { transform: "scale(0.97) translate3d(0, 15px, 0)" }]);
  ol_animations.set("background_fade_in", [{ opacity: `0` }, { opacity: "1" }]);
  var ol_timings = /* @__PURE__ */ new Map();
  ol_timings.set("mobile_a", { duration: 300, easing: "cubic-bezier(0.69, 0, 0.29, 1)", fill: "both", iterations: 1 });
  ol_timings.set("dekstop_a", { duration: 300, easing: "cubic-bezier(0.69, 0, 0.29, 1)", fill: "both", iterations: 1 });
})();
