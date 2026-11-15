const path = require('path');
const fs = require('fs');

/**
 * Validates that userPath resolves strictly inside baseDir.
 * Uses path.relative() to prevent sibling-prefix confusion (e.g., /app/data vs /app/data-secret)
 * and resolves symlinks via fs.realpathSync when the path exists.
 *
 * @param {string} baseDir - The trusted base directory
 * @param {string} userPath - User-controlled path or filename
 * @returns {string} - The safely resolved absolute path
 * @throws {Error} - If path traversal or symbolic link escape is detected
 */
function resolveSafePath(baseDir, userPath) {
  if (!baseDir || typeof baseDir !== 'string') {
    throw new Error('Base directory must be a valid string');
  }

  if (!userPath || typeof userPath !== 'string') {
    throw new Error('User path must be a valid non-empty string');
  }

  // Reject embedded null bytes immediately
  if (userPath.includes('\0') || baseDir.includes('\0')) {
    throw new Error('Null byte detected in path');
  }

  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, userPath);

  // Validate containment using path.relative()
  const relative = path.relative(resolvedBase, resolvedTarget);
  const isContained = !relative.startsWith('..') && !path.isAbsolute(relative);

  if (!isContained) {
    throw new Error('Path traversal attempt detected');
  }

  // If path exists on disk, verify realpath does not break out via symbolic links
  if (fs.existsSync(resolvedTarget)) {
    const realBase = fs.realpathSync(resolvedBase);
    const realTarget = fs.realpathSync(resolvedTarget);
    const realRelative = path.relative(realBase, realTarget);
    if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) {
      throw new Error('Symbolic link traversal attempt detected');
    }
  }

  return resolvedTarget;
}

module.exports = {
  resolveSafePath
};
