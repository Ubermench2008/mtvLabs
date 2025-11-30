export function printFuncCall(f, model) {
    const getVarValue = (name) => model.get(model.decls().find(d => d.name() == name)).toString();
    const argExprs = f.parameters.map(p => p.name).map(getVarValue);
    const argsText = argExprs.join(', ');
    const resExprs = f.returns.map(r => r.name).map(n => `${n} = ${getVarValue(n)}`);
    const resultsText = resExprs.join(', ');
    var text = `${f.name}(${argsText}) => [${resultsText}]`;
    for (var v of f.locals)
        text += `\n${v.name} = ${getVarValue(v.name)}`;
    return text;
}
//# sourceMappingURL=printFuncCall.js.map