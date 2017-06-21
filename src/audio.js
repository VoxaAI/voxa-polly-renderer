'use strict';

const tmp = require('tmp-promise');
const debug = require('debug')('voxa:polly');
const fs = require('fs-extra');
const Promise = require('bluebird');
const util = require('util');
const Stream = require('stream');
const exec = require('child-process-promise').exec;
const toArray = require('stream-to-array');
const _ = require('lodash');

module.exports = {
  toTempFile,
  toAlexaFormat,
  convert,
  soxConvert,
  objectToCmdOptions,
  coerceStream,
};

function toTempFile(stream, options) {
  const postfix = options.postfix || '.mp3';
  const prefix = options.prefix || 'voxa-polly-';

  return new Promise((resolve, reject) => {
    tmp.file({ postfix, prefix })
      .then((tmpData) => {
        debug(`Created temporary file ${tmpData.path}`);
        stream.on('error', reject);
        stream.pipe(fs.createWriteStream(tmpData.path, { flags: 'w', autoClose: true }));
        stream.on('end', () => {
          setTimeout(() => { resolve(tmpData.path); });
        });
      })
      .catch(reject);
  });
}


function toAlexaFormat(stream, options) {
  options = options || {};
  options.extension = 'mp3';
  return convert(stream, { r: '16000', C: 48 }, options);
}

function convert(stream, soxOptions, options) {
  options = options || {};
  stream = coerceStream(stream);
  return toTempFile(stream, options)
    .then(fpath => soxConvert(fpath, soxOptions, options))
    .then((outPath) => {
      if (options.asFile) return outPath;
      if (options.asBuffer) {
        return toArray(fs.createReadStream(outPath))
          .then((parts) => {
            const buffers = parts.map(part => (util.isBuffer(part) ? part : Buffer.from(part)));
            return Buffer.concat(buffers);
          });
      }
      return fs.createReadStream(outPath);
    });
}

function soxConvert(fpath, soxOptions, options) {
  debug('Converting.');
  const outPath = `${fpath}.soxed.${options.extension || 'wav'}`;
  const command = `sox ${fpath} ${objectToCmdOptions(soxOptions)} ${outPath}`;
  debug(`executing: ${command}`);
  return exec(command)
    .then(_.constant(outPath));
}

function objectToCmdOptions(options) {
  return _(options)
    .map((value, key) => {
      if (key.length > 1) {
        return `--${key} ${value}`;
      }

      return `-${key} ${value}`;
    })
    .value()
    .join(' ');
}

function coerceStream(stream) {
  if (util.isBuffer(stream)) {
    const stream2 = new Stream.PassThrough();
    stream2.end(stream);
    return stream2;
  }
  return stream;
}
