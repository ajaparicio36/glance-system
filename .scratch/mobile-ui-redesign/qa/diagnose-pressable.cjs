const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const appRoot = path.resolve(__dirname, '../../../glance-app');
const ts = require(path.join(appRoot, 'node_modules/typescript'));
const runtime = path.join(appRoot, 'node_modules/react-native-css-interop/src/runtime');

function extract(file, name) {
  const text = fs.readFileSync(path.join(runtime, file), 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const declaration = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.ok(declaration, `Installed function ${name} exists`);
  return declaration.getText(source).replace(/^export\s+(default\s+)?/, '');
}

const sources = [
  extract('native/native-interop.ts', 'collectInlineRules'),
  extract('native/native-interop.ts', 'applyRules'),
  extract('native/styles.ts', 'getOpaqueStyles'),
  extract('wrap-jsx.ts', 'wrapJSX'),
].join('\n');
const context = vm.createContext({
  StyleRuleSetSymbol: Symbol('StyleRuleSet'),
  opaqueStyles: new WeakMap(),
  interopComponents: new Map(),
  maybeHijackSafeAreaProvider: value => value,
  process: { env: { NODE_ENV: 'test' } },
  assignToTarget: (target, value) => { target.style = value; },
});
vm.runInContext(ts.transpileModule(sources, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
const callback = ({ pressed }) => ({ minHeight: 48, backgroundColor: '#ffffff', opacity: pressed ? 0.7 : 1 });
const state = { props: {}, config: { target: ['style'] } };
const normal = [];
context.collectInlineRules(state, {}, callback, undefined, normal, []);
context.applyRules(state, {}, normal, []);
assert.deepEqual(Object.keys(state.props.style), []);
let evaluated = false;
const NativePressable = {};
const InteropPressable = {};
context.interopComponents.set(NativePressable, InteropPressable);
const jsx = context.wrapJSX((type, props) => ({ type, props }));
assert.equal(jsx(NativePressable, { style: callback }).type, InteropPressable);
const native = jsx(NativePressable, { cssInterop: false, style: input => { evaluated = true; return callback(input); } });
assert.equal(native.type, NativePressable);
assert.equal(native.props.style({ pressed: false }).minHeight, 48);
assert.equal(evaluated, true);
assert.equal('cssInterop' in native.props, false);
console.log('Confirmed installed NativeWind interop spreads a style callback into an empty object; cssInterop=false preserves the native Pressable callback.');
