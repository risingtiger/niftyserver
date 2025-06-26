class DPlaceHolderDirective extends Lit_Directive {
    s;
    constructor(part){
        super(part);
        this.s = {
            prop: 0
        };
    }
    update(_part, [_a, _b]) {
        console.log("update");
        return this.state;
    }
}
const dplaceholderdirective = Lit_directive(DPlaceHolderDirective);
export { dplaceholderdirective };
