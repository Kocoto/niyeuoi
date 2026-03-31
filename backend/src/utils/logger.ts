const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
};

function timestamp() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

const logger = {
    info: (service: string, action: string, detail?: any) => {
        const extra = detail !== undefined ? ` ${colors.gray}→ ${JSON.stringify(detail)}${colors.reset}` : '';
        console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.cyan}${colors.bold}[${service}]${colors.reset} ${colors.green}${action}${colors.reset}${extra}`);
    },
    warn: (service: string, action: string, detail?: any) => {
        const extra = detail !== undefined ? ` ${colors.gray}→ ${JSON.stringify(detail)}${colors.reset}` : '';
        console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.cyan}${colors.bold}[${service}]${colors.reset} ${colors.yellow}⚠ ${action}${colors.reset}${extra}`);
    },
    error: (service: string, action: string, err?: any) => {
        const detail = err instanceof Error ? err.message : JSON.stringify(err);
        console.error(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.cyan}${colors.bold}[${service}]${colors.reset} ${colors.red}✖ ${action}${colors.reset} ${colors.gray}→ ${detail}${colors.reset}`);
    },
    success: (service: string, action: string, detail?: any) => {
        const extra = detail !== undefined ? ` ${colors.gray}→ ${JSON.stringify(detail)}${colors.reset}` : '';
        console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.cyan}${colors.bold}[${service}]${colors.reset} ${colors.magenta}✔ ${action}${colors.reset}${extra}`);
    },
    http: (method: string, url: string, status: number, ms: number) => {
        const statusColor = status >= 500 ? colors.red : status >= 400 ? colors.yellow : colors.green;
        console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.bold}HTTP${colors.reset} ${colors.yellow}${method.padEnd(6)}${colors.reset} ${url.padEnd(40)} ${statusColor}${status}${colors.reset} ${colors.gray}${ms}ms${colors.reset}`);
    },
};

export default logger;
