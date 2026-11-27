// Minimal JSON Schema checker for the subset the schemas in schemas/ use (type with integer and type lists, required,
// properties, additionalProperties false or a schema, items, minItems, enum, minimum, maximum, pattern, local $ref).
// The same subset as scripts/validate-data.js; shared by the tests of the datasets added on 27 Nov 2026.
function checkSchema(schema, value, where, root, out) {
  if (schema.$ref) {
    const target = schema.$ref.replace(/^#\//, '').split('/').reduce((o, k) => o && o[k], root);
    if (!target) { out.push(`${where}: unresolved $ref ${schema.$ref}`); return; }
    checkSchema(target, value, where, root, out);
    return;
  }
  const kind = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
  if (schema.type) {
    const types = [].concat(schema.type);
    if (!types.some((t) => (t === 'integer' ? Number.isInteger(value) : kind(value) === t))) { out.push(`${where}: expected ${types.join(' or ')}, got ${kind(value)}`); return; }
  }
  if (schema.enum && !schema.enum.includes(value)) out.push(`${where}: ${JSON.stringify(value)} is not one of ${schema.enum.join(', ')}`);
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) out.push(`${where}: ${value} is below minimum ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) out.push(`${where}: ${value} is above maximum ${schema.maximum}`);
  }
  if (typeof value === 'string' && schema.pattern && !new RegExp(schema.pattern).test(value)) out.push(`${where}: "${value.slice(0, 60)}" does not match ${schema.pattern}`);
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) out.push(`${where}: has ${value.length} items, needs at least ${schema.minItems}`);
    if (schema.items) value.forEach((v, i) => checkSchema(schema.items, v, `${where}[${i}]`, root, out));
  }
  if (kind(value) === 'object') {
    (schema.required || []).forEach((k) => { if (!(k in value)) out.push(`${where}: missing required ${k}`); });
    const props = schema.properties || {};
    Object.entries(value).forEach(([k, v]) => {
      if (props[k]) checkSchema(props[k], v, `${where}.${k}`, root, out);
      else if (schema.additionalProperties === false) out.push(`${where}: unexpected property ${k}`);
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') checkSchema(schema.additionalProperties, v, `${where}.${k}`, root, out);
    });
  }
}
const check = (schema, value, name) => { const out = []; checkSchema(schema, value, name, schema, out); return out; };
module.exports = { checkSchema, check };
