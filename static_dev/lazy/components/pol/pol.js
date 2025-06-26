var ShapeE = /*#__PURE__*/ function(ShapeE) {
    ShapeE[ShapeE["NOT_APPLICABLE"] = 0] = "NOT_APPLICABLE";
    ShapeE[ShapeE["PRIORITY_MOBILE_FULL"] = 1] = "PRIORITY_MOBILE_FULL";
    ShapeE[ShapeE["PRIORITY_MOBILE_BOTTOM_HALF"] = 2] = "PRIORITY_MOBILE_BOTTOM_HALF";
    ShapeE[ShapeE["PRIORITY_MOBILE_BOTTOM_THIRD"] = 3] = "PRIORITY_MOBILE_BOTTOM_THIRD";
    ShapeE[ShapeE["PRIORITY_DESKTOP_MD"] = 4] = "PRIORITY_DESKTOP_MD";
    ShapeE[ShapeE["PRIORITY_DESKTOP_LG"] = 5] = "PRIORITY_DESKTOP_LG";
    ShapeE[ShapeE["PRIORITY_DESKTOP_XL"] = 6] = "PRIORITY_DESKTOP_XL";
    ShapeE[ShapeE["PRIORITY_DESKTOP_XXL"] = 7] = "PRIORITY_DESKTOP_XXL";
    ShapeE[ShapeE["XS"] = 8] = "XS";
    return ShapeE;
}(ShapeE || {});
const DESKTOP_DEFAULT_WIDTH = 480;
const DESKTOP_TO_MOBILE_DOWNSIZE_WIDTH = 390;
const DESKTOP_DEFAULT_HEIGHT = 800;
const DESKTOP_DEFAULT_TOP = 34;
const MOBILE_DEFAULT_HALF_HEIGHT = 400;
const MOBILE_DEFAULT_THIRD_HEIGHT = 200;
const WINDOW_HEIGHT_PRIORITY_MOBILE_FULL = 0;
const WINDOW_WIDTH_PRIORITY_MOBILE_FULL = 0;
const WINDOW_HEIGHT_PRIORITY_MOBILE_BOTTOM_HALF = MOBILE_DEFAULT_HALF_HEIGHT;
const WINDOW_WIDTH_PRIORITY_MOBILE_BOTTOM_HALF = 0;
const WINDOW_HEIGHT_PRIORITY_MOBILE_BOTTOM_THIRD = MOBILE_DEFAULT_THIRD_HEIGHT;
const WINDOW_WIDTH_PRIORITY_MOBILE_BOTTOM_THIRD = 0;
const WINDOW_HEIGHT_PRIORITY_DESKTOP_MD = DESKTOP_DEFAULT_HEIGHT;
const WINDOW_WIDTH_PRIORITY_DESKTOP_MD = DESKTOP_DEFAULT_WIDTH;
const WINDOW_HEIGHT_PRIORITY_DESKTOP_LG = 1000;
const WINDOW_WIDTH_PRIORITY_DESKTOP_LG = 640;
const WINDOW_HEIGHT_PRIORITY_DESKTOP_XL = 1200;
const WINDOW_WIDTH_PRIORITY_DESKTOP_XL = 800;
const WINDOW_HEIGHT_PRIORITY_DESKTOP_XXL = 1400;
const WINDOW_WIDTH_PRIORITY_DESKTOP_XXL = 1024;
const WINDOW_HEIGHT_XS = 350;
const WINDOW_WIDTH_XS = 280;
class CPOl extends HTMLElement {
    state;
    model;
    $;
    wrapperAnimation;
    slotAnimation;
    sheet;
    shadow;
    constructor(){
        super();
        this.state = {
            title: '',
            width: '',
            height: '',
            top: '',
            left: '',
            marginLeft: '',
            shape: 1,
            showHeader: true,
            isMinimizable: true,
            isMinimized: false,
            isMobileCentric: false
        };
        this.$ = this.querySelector;
        this.shadow = this.attachShadow({
            mode: 'open'
        });
    }
    connectedCallback() {
        this.state.title = this.getAttribute('title') || '';
        this.state.isMinimizable = this.getAttributeAsBoolean('minimizable', true);
        this.state.showHeader = this.getAttributeAsBoolean('showHeader', true);
        const child = this.firstElementChild;
        child.addEventListener('toggleCollapseExpand', ()=>{
            this.toggleCollapseExpand();
        });
        this.stateChange();
        if (child.tagName.startsWith('C-') || child.tagName.startsWith('VP-')) {
            child.addEventListener('hydrated', ()=>{
                this.onOpen();
            });
        } else {
            this.onOpen();
        }
    }
    disconnectedCallback() {}
    static get observedAttributes() {
        return [
            'minimize'
        ];
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
    //
    }
    onExpanded() {
    //
    }
    getAttributeAsBoolean(name, def) {
        let value = this.getAttribute(name) || def;
        if (typeof value === 'boolean') {
            return value;
        }
        value = String(value).trim().toLowerCase();
        if ([
            '1',
            'true',
            'yes'
        ].includes(value)) {
            return true;
        }
        if ([
            '0',
            'false',
            'no'
        ].includes(value)) {
            return false;
        }
        return def;
    }
    onOpen() {
        this.setupWindow();
        this.setupDom();
        this.setupAnimation();
        this.wrapperAnimation.addEventListener('finish', ()=>{
            this.onOpenAnimateFinished();
        });
        this.slotAnimation.addEventListener('finish', ()=>{
            this.state.isMinimized = !this.state.isMinimized;
            if (this.state.isMinimized) {
                this.onCollapsed();
            } else {
                this.onExpanded();
            }
            this.stateChange();
        });
        this.stateChange();
        this.setAttribute('opening', 'true');
        this.animateShow();
    }
    onOpenAnimateFinished() {
        if (this.wrapperAnimation.playbackRate === -1) {
            this.removeAttribute('collapsing');
            this.removeAttribute('opened');
            this.setAttribute('collapsed', 'true');
            this.dispatchEvent(new Event('collapsed'));
            return;
        }
        this.removeAttribute('opening');
        this.removeAttribute('collapsed');
        this.setAttribute('opened', 'true');
    }
    setupWindow() {
        const WINDOW_INNER_WIDTH = window.innerWidth;
        const TOP = Number(this.getAttribute('top') || 0);
        const LEFT = Number(this.getAttribute('left') || 0);
        const WINDOW_DIMENSION = this.getSetupWindowDimension();
        if (WINDOW_DIMENSION.width) {
            this.state.left = LEFT ? `${LEFT}px` : '50%';
            this.state.marginLeft = `-${WINDOW_DIMENSION.width / 2}px`;
            this.state.width = `${WINDOW_DIMENSION.width}px`;
        } else {
            this.state.left = '0';
            this.state.width = '100%';
        }
        if (WINDOW_DIMENSION.height) {
            this.state.height = `${WINDOW_DIMENSION.height}px`;
            this.state.top = TOP ? `${TOP}px` : `${DESKTOP_DEFAULT_TOP}px`;
        } else {
            this.state.height = '100%';
            this.state.top = '0';
        }
        this.state.isMobileCentric = WINDOW_INNER_WIDTH < DESKTOP_DEFAULT_WIDTH;
    }
    getSetupWindowDimension() {
        const WINDOW_INNER_WIDTH = window.innerWidth;
        const SHAPE = Number(this.getAttribute('shape') || 0) || 1;
        const WIDTH = this.getAttribute('width') || 0;
        const HEIGHT = this.getAttribute('height') || 0;
        if (Number(WIDTH) > 0) {
            if (WINDOW_INNER_WIDTH < DESKTOP_DEFAULT_WIDTH) {
                return {
                    height: 0,
                    width: 0
                };
            }
            return {
                height: Number(HEIGHT) || DESKTOP_DEFAULT_HEIGHT,
                width: Number(WIDTH)
            };
        }
        if ([
            1,
            2,
            3
        ].includes(SHAPE)) {
            if (WINDOW_INNER_WIDTH >= DESKTOP_DEFAULT_WIDTH) {
                return {
                    height: DESKTOP_DEFAULT_HEIGHT,
                    width: DESKTOP_TO_MOBILE_DOWNSIZE_WIDTH
                };
            }
            switch(SHAPE){
                case 1:
                    return {
                        height: WINDOW_HEIGHT_PRIORITY_MOBILE_FULL,
                        width: WINDOW_WIDTH_PRIORITY_MOBILE_FULL
                    };
                case 2:
                    return {
                        height: WINDOW_HEIGHT_PRIORITY_MOBILE_BOTTOM_HALF,
                        width: WINDOW_WIDTH_PRIORITY_MOBILE_BOTTOM_HALF
                    };
                case 3:
                    return {
                        height: WINDOW_HEIGHT_PRIORITY_MOBILE_BOTTOM_THIRD,
                        width: WINDOW_WIDTH_PRIORITY_MOBILE_BOTTOM_THIRD
                    };
            }
        }
        if ([
            4,
            5,
            6,
            7
        ].includes(SHAPE)) {
            if (WINDOW_INNER_WIDTH < DESKTOP_DEFAULT_WIDTH) {
                return {
                    height: 0,
                    width: 0
                };
            }
            switch(SHAPE){
                case 4:
                    return {
                        height: WINDOW_HEIGHT_PRIORITY_DESKTOP_MD,
                        width: WINDOW_WIDTH_PRIORITY_DESKTOP_MD
                    };
                case 5:
                    return {
                        height: WINDOW_HEIGHT_PRIORITY_DESKTOP_LG,
                        width: WINDOW_WIDTH_PRIORITY_DESKTOP_LG
                    };
                case 6:
                    return {
                        height: WINDOW_HEIGHT_PRIORITY_DESKTOP_XL,
                        width: WINDOW_WIDTH_PRIORITY_DESKTOP_XL
                    };
                case 7:
                    return {
                        height: WINDOW_HEIGHT_PRIORITY_DESKTOP_XXL,
                        width: WINDOW_WIDTH_PRIORITY_DESKTOP_XXL
                    };
            }
        }
        if (SHAPE === 8) {
            return {
                height: WINDOW_HEIGHT_XS,
                width: WINDOW_WIDTH_XS
            };
        }
        return {
            height: 0,
            width: 0
        };
    }
    setupDom() {
        const wrapper = this.shadow.querySelector('.wrapper');
        wrapper.style.bottom = '0';
        wrapper.style.display = 'block grid';
        wrapper.style.gridTemplateRows = 'auto 1fr';
        wrapper.style.marginLeft = this.state.marginLeft;
        wrapper.style.maxHeight = this.state.height;
        wrapper.style.right = '0';
        wrapper.style.width = this.state.width;
        if (this.state.isMobileCentric) {
            wrapper.classList.add('mobile_centric');
        }
    }
    setupAnimation() {
        const WRAPPER = this.shadow.querySelector('.wrapper');
        const SLOT = WRAPPER.querySelector('header + *');
        const ANIMATIONS = this.getSetupAnimationAnimations();
        const TIMINGS = this.getSetupAnimationTimings();
        const ENV = this.state.isMobileCentric ? 'mobile' : 'desktop';
        this.wrapperAnimation = WRAPPER.animate(ANIMATIONS.get(`${ENV}_wrapper_fade_up`), TIMINGS.get('mobile_a'));
        this.wrapperAnimation.pause();
        this.slotAnimation = SLOT.animate(ANIMATIONS.get(`${ENV}_slot_collapse`), TIMINGS.get('mobile_a'));
        this.slotAnimation.pause();
    }
    getSetupAnimationAnimations() {
        const ANIMATIONS = new Map();
        ANIMATIONS.set('mobile_wrapper_fade_up', [
            {
                opacity: '0',
                transform: `translateY(${this.state.height})`
            },
            {
                opacity: '1',
                transform: 'translateY(0)'
            }
        ]);
        ANIMATIONS.set('desktop_wrapper_fade_up', [
            {
                opacity: '0',
                transform: `translateY(${this.state.height})`
            },
            {
                opacity: '1',
                transform: 'translateY(0)'
            }
        ]);
        // While it is easier/straightforward to implement this in CSS,
        // unfortunately animation does not work if `height`/`max-height` is set to `auto`.
        // Since we can not dynamically set the value in the CSS file, we'll set the animation here.
        ANIMATIONS.set('desktop_slot_collapse', [
            {
                maxHeight: `${this.state.height}`
            },
            {
                maxHeight: '0'
            }
        ]);
        // While it is easier/straightforward to implement this in CSS,
        // unfortunately animation does not work if `height`/`max-height` is set to `auto`.
        // Since we can not dynamically set the value in the CSS file, we'll set the animation here.
        ANIMATIONS.set('desktop_slot_expand', [
            {
                maxHeight: '0'
            },
            {
                maxHeight: `${this.state.height}`
            }
        ]);
        return ANIMATIONS;
    }
    getSetupAnimationTimings() {
        const TIMINGS = new Map();
        TIMINGS.set('mobile_a', {
            duration: 500,
            easing: 'cubic-bezier(0.69, 0, 0.29, 1)',
            fill: 'both',
            iterations: 1
        });
        TIMINGS.set('dekstop_a', {
            duration: 1000,
            easing: 'cubic-bezier(0.69, 0, 0.29, 1)',
            fill: 'both',
            iterations: 1
        });
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
        return html`{--css--}{--html--}`;
    }
}
customElements.define('c-pol', CPOl);
export { };
