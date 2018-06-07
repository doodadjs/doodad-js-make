#!/usr/bin/env node
// doodad-js - Object-oriented programming framework
// File: make.js - Make command
// Project home: https://github.com/doodadjs/
// Author: Claude Petit, Quebec city
// Contact: doodadjs [at] gmail.com
// Note: I'm still in alpha-beta stage, so expect to find some bugs or incomplete parts !
// License: Apache V2
//
//	Copyright 2015-2018 Claude Petit
//
//	Licensed under the Apache License, Version 2.0 (the "License");
//	you may not use this file except in compliance with the License.
//	You may obtain a copy of the License at
//
//		http://www.apache.org/licenses/LICENSE-2.0
//
//	Unless required by applicable law or agreed to in writing, software
//	distributed under the License is distributed on an "AS IS" BASIS,
//	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//	See the License for the specific language governing permissions and
//	limitations under the License.

"use strict";

const cp = require('child_process');

const worker = require('./make_worker.js');

const EXECARGS_FILTER = [
	['--inspect', 1],
	['--inspect-brk', 2],
	['--debug', 1],
	['--debug-brk', 2],
	['-r', 2],
];

const filterExecArgv = function _filterExecArgv(execArgv) {
	const result = [];
	let removeCount = 0;
	execArgv.forEach(function(arg) {
		if (removeCount > 0) {
			removeCount--;
		} else {
			// NOTE: "arg.split('=', 2)"" doesn't stop after 2 items.
			const sepPos = arg.indexOf('='),
				argParts = (sepPos < 0 ? [arg, undefined] : [arg.slice(0, sepPos), arg.slice(sepPos + 1)]);
			const index = EXECARGS_FILTER.findIndex(filter => filter[0] === argParts[0]);
			if (index < 0) {
				result.push(arg);
			} else {
				removeCount = EXECARGS_FILTER[index][1] - 1;
				if (argParts[1] !== undefined) {
					removeCount--;
				};
			};
		};
	});
	return result;
};

const spawnWorker = function _spawnWorker(args) {
	global.setImmediate(function _go() {
		const execArgv = filterExecArgv(process.execArgv);
		const workerPath = require.resolve('./make_worker.js');
		cp.spawn(process.execPath, execArgv.concat([workerPath], args), {
			env: process.env,
			cwd: process.cwd(),
			stdio: 'inherit',
		});
	});
};

if (require.main === module) {
	worker(process.argv.slice(2));
} else {
	spawnWorker(process.argv.slice(2));
};
