const RegExParams = (original_matchstr)=>{
    const pathparamnames = [];
    const pattern = original_matchstr.replace(/:([a-z][a-z_0-9]+)/g, (_match, pathparamname)=>{
        pathparamnames.push(pathparamname);
        return '([a-zA-Z0-9_]+)';
    });
    const regex = new RegExp(pattern);
    const paramnames = pathparamnames;
    return {
        regex,
        paramnames,
        pattern
    };
};
const GetPathParams = (pathparams_propnames, pathparams_vals)=>{
    const pathparams = pathparams_propnames.map((_, i)=>{
        return {
            [pathparams_propnames[i]]: pathparams_vals[i]
        };
    });
    return Object.assign({}, ...pathparams);
};
export { RegExParams, GetPathParams };
