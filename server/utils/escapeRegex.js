// Escapes RegExp special characters in user-supplied search strings.
// Without this, search endpoints that do `new RegExp(userInput, 'i')` are
// vulnerable to ReDoS (catastrophic backtracking) and to hard crashes from
// unmatched groups (e.g. a search for "Rohit (" throws a SyntaxError).
// Used by every controller that turns a free-text query into a RegExp.
export const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
