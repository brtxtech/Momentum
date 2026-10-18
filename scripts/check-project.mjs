import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['--test','tests/project.test.mjs'],{stdio:'inherit'});
