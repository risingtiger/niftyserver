(() => {
  // ../../.nifty/files/instance/lazy/directives/placeholder_directive.js
  var DPlaceHolderDirective = class extends Lit_Directive {
    s;
    constructor(part) {
      super(part);
      this.s = { prop: 0 };
    }
    update(_part, [_a, _b]) {
      console.log("update");
      return this.state;
    }
  };
  var dplaceholderdirective = Lit_directive(DPlaceHolderDirective);
})();
