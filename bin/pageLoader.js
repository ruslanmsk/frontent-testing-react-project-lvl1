#!/usr/bin/env node

import commander from 'commander';
import process from 'process';
import loadPage from '../index.js';

const program = new commander.Command();

program
  .version('1.0.0')
  .description('Loades html page from url and save it locally')
  .helpOption('-h, --help', 'output usage information')
  .arguments('<url>')
  .action(async (url, options) => {
    try {
      const destinationPath = await loadPage(url, options.output);
      console.log(destinationPath);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  })
  .option('--output [directory]', 'output directory', process.cwd());

program.parse(process.argv);
