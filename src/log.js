const LEVELS = { silent: -1, error: 0, warn: 1, info: 2, debug: 3 };

let threshold = LEVELS.info;

export function setLogLevel(level) {
    const value = LEVELS[String(level ?? '').toLowerCase()];
    if (value === undefined) {
        throw new Error(`Unknown log level "${level}", expected one of: ${Object.keys(LEVELS).join(', ')}`);
    }
    threshold = value;
}

function write(level, message, fields) {
    if (LEVELS[level] > threshold) {
        return;
    }
    let line = `${new Date().toISOString()} ${level.toUpperCase()} ${message}`;
    if (fields !== undefined) {
        line += ' ' + JSON.stringify(fields);
    }
    if (level === 'error' || level === 'warn') {
        console.error(line);
    } else {
        console.log(line);
    }
}

export const log = {
    error: (message, fields) => write('error', message, fields),
    warn: (message, fields) => write('warn', message, fields),
    info: (message, fields) => write('info', message, fields),
    debug: (message, fields) => write('debug', message, fields),
};
