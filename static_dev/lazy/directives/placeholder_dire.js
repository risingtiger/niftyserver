var AnimeioStylesE = /*#__PURE__*/ function(AnimeioStylesE) {
    AnimeioStylesE[AnimeioStylesE["FADE"] = 0] = "FADE";
    AnimeioStylesE[AnimeioStylesE["SLIDE"] = 1] = "SLIDE";
    AnimeioStylesE[AnimeioStylesE["PULSE"] = 2] = "PULSE";
    return AnimeioStylesE;
}(AnimeioStylesE || {});
const animateio_styles = [
    {
        name: "fade",
        props: [
            {
                opacity: "0"
            },
            {
                opacity: "1"
            }
        ],
        opts: {
            duration: 420,
            easing: "cubic-bezier(.18,.24,.15,1)",
            fill: "both",
            iterations: 1
        }
    },
    {
        name: "slide",
        props: [
            {
                transform: "scale(1)"
            },
            {
                transform: "scale(2)"
            }
        ],
        opts: {
            duration: 420,
            easing: "ease-in-out",
            fill: "both",
            iterations: 1
        }
    },
    {
        name: "pulse",
        props: [
            {
                transform: "scale(1)"
            },
            {
                transform: "scale(0.3)"
            },
            {
                transform: "scale(1)"
            }
        ],
        opts: {
            duration: 420,
            easing: "ease-in-out",
            fill: "both",
            iterations: 1
        }
    }
];
class Animeioio extends Lit_Directive {
    s;
    animatehandle = null;
    element = document.body;
    styleindex = 0;
    keyframe_effects;
    resetaftermillis = 0;
    constructor(part){
        super(part);
        this.s = {
            has_been_played: false
        };
        this.element = part.element;
        this.element.style.display = "none";
        this.element.style.visibility = "invisible";
    }
    update(part, [state_at, styleindex, resetaftermillis]) {
        this.resetaftermillis = resetaftermillis;
        if (this.animatehandle && this.animatehandle.playState === "running") {
            return Lit_noChange;
        }
        if (!this.s.has_been_played) {
            part.element.style.display = "none";
            this.keyframe_effects = new KeyframeEffect(part.element, animateio_styles[styleindex].props, animateio_styles[styleindex].opts);
            this.animatehandle = new Animation(this.keyframe_effects, document.timeline);
            this.animatehandle.onfinish = this.finished.bind(this);
            this.s.has_been_played = true;
        } else if (state_at > 0) {
            this.element.style.display = "block";
            part.element.offsetHeight; // trigger reflow
            this.startanim(this.animatehandle);
        } else if (state_at === 0) {
            this.animatehandle.reverse();
        }
    }
    startanim(animatehandle) {
        animatehandle.playbackRate = 1;
        animatehandle.currentTime = 0;
        animatehandle.play();
    }
    finished() {
        if (this.resetaftermillis > 0) {
            if (this.animatehandle.currentTime > 0) {
                setTimeout(()=>{
                    this.animatehandle.reverse();
                }, this.resetaftermillis);
            } else {
                this.element.style.display = "none";
            }
        } else {
            if (this.animatehandle.currentTime === 0) {
                this.element.style.display = "none";
            }
        }
    }
}
window.animeio = Lit_directive(Animeioio);
export { };
