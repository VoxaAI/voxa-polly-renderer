'use strict';

const expect = require('chai').expect;
const Readable = require('stream').Readable;
const audio = require('../src/audio');
const fs = require('fs-extra');
const tmp = require('tmp-promise');
const exec = require('child-process-promise').exec;
const _ = require('lodash');

describe('audio', () => {
  let wavPath;
  beforeEach(() => getWavPath()
    .then((_wavpath) => { wavPath = _wavpath; }));

  describe('toTempFile', () => {
    it('should return a path to a file with .mp3 extension', () => {
      const rs = new Readable();
      rs.push('test');
      rs.push(null);

      return audio.toTempFile(rs, {})
        .then((path) => {
          expect(path).to.be.an('string');
          expect(path).to.have.string('.mp3');
        });
    });

    it('should have the content of the stream', () => {
      const rs = new Readable();
      rs.push('test');
      rs.push(null);

      return audio.toTempFile(rs, {})
        .then(path => fs.readFile(path))
        .then((data) => {
          expect(data.toString()).to.equal('test');
        });
    });
  });

  describe('objectToCmdOptions', () => {
    it('should convert an object to a string of cli options', () => {
      expect(audio.objectToCmdOptions({ r: '16K', C: 48 })).to.equal('-r 16K -C 48');
      expect(audio.objectToCmdOptions({ bits: '16', C: 48 })).to.equal('--bits 16 -C 48');
    });
  });

  describe('soxConvert', () => {
    it('should return the path to the converted audio file', () => audio.soxConvert(wavPath, {}, { extension: 'mp3' })
      .then((convertedPath) => {
        expect(convertedPath).to.equal(`${wavPath}.soxed.mp3`);
      }));
  });

  describe('toAlexaFormat', () => {
    it('should create a strem that can be used with alexa', () => {
      const readStream = fs.createReadStream(wavPath, { autoClose: true });
      return audio.toAlexaFormat(readStream, {})
        .then(stream => tmp.file({ postfix: '.mp3' })
          .then(tmpFile => new Promise((resolve, reject) => {
            stream.on('error', reject);
            stream.pipe(fs.createWriteStream(tmpFile.path), { autoClose: true });
            stream.on('end', () => {
              resolve(tmpFile);
            });
          })))
        .then(tmpFile => exec(`soxi ${tmpFile.path}`))
        .then((result) => {
          expect(result.stdout).to.have.string('Sample Rate    : 16000');
          expect(result.stdout).to.have.string('Bit Rate       : 48.0k');
          expect(result.stdout).to.have.string('Sample Encoding: MPEG audio (layer I, II or III)');
        });
    });

    it('should create a buffer that can be used with alexa', () => {
      const readStream = fs.createReadStream(wavPath, { autoClose: true });
      return audio.toAlexaFormat(readStream, { asBuffer: true })
        .then(buffer => tmp.file({ postfix: '.mp3' })
          .then(tmpFile => fs.writeFile(tmpFile.path, buffer).then(_.constant(tmpFile))))
        .then(tmpFile => exec(`soxi ${tmpFile.path}`))
        .then((result) => {
          expect(result.stdout).to.have.string('Sample Rate    : 16000');
          expect(result.stdout).to.have.string('Bit Rate       : 48.0k');
          expect(result.stdout).to.have.string('Sample Encoding: MPEG audio (layer I, II or III)');
        });
    });

    it('should create an audio file that can be used with alexa', () => {
      const readStream = fs.createReadStream(wavPath, { autoClose: true });
      return audio.toAlexaFormat(readStream, { asFile: true })
        .then(mp3Path => exec(`soxi ${mp3Path}`))
        .then((result) => {
          expect(result.stdout).to.have.string('Sample Rate    : 16000');
          expect(result.stdout).to.have.string('Bit Rate       : 48.0k');
          expect(result.stdout).to.have.string('Sample Encoding: MPEG audio (layer I, II or III)');
        });
    });
  });
});

// copies the test.wav file to a tmp location so we can use a different one for every test
function getWavPath() {
  return tmp.file({ postfix: '.mp3' })
    .then((filedata) => {
      fs.writeFileSync(filedata.path, fs.readFileSync(`${__dirname}/test.mp3`));
      return filedata.path;
    });
}
