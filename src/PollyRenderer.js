'use strict';

const DefaultRenderer = require('voxa').DefaultRenderer;
const Promise = require('bluebird');
const _ = require('lodash');
const AWS = require('aws-sdk');
const crypto = require('crypto');
const audio = require('./audio');
const awsHelpers = require('./aws');
const debug = require('debug')('voxa:polly');


module.exports = class Polly extends DefaultRenderer {
  constructor(config) {
    super(config);

    this.s3 = new AWS.S3();
    this.polly = new AWS.Polly();
  }

  renderMessage(msg, alexaEvent) {
    return super.renderMessage(msg, alexaEvent)
      .then((rendered) => {
        if (msg.voice) {
          debug(`Rendering with ${msg.voice} voice`);
          return this.renderViaPolly(rendered);
        }

        return rendered;
      });
  }

  renderViaPolly(rendered) {
    const toRender = ['ask', 'tell', 'say', 'reprompt'];

    return Promise.all(_(toRender)
      .filter(key => rendered[key])
      .map(key => this.createPollyTag(rendered[key], rendered.voice)
        .then((audioTag) => { rendered[key] = audioTag; }))
      .value())
      .then(_.constant(rendered));
  }

  createPollyTag(txt, voice) {
    const ssml = `<speak> ${txt} </speak>`;
    const hash = crypto.createHash('md5').update(ssml).digest('hex');
    const key = `${this.config.renderer.s3Path}/${hash}.mp3`;
    const url = `https://s3.amazonaws.com/${this.config.renderer.bucket}/${key}`;

    return awsHelpers.s3KeyExists(key, this.config.renderer.bucket, this.s3)
      .then((keyExists) => {
        if (keyExists) {
          return `<audio src="${url}" />`;
        }

        return awsHelpers.synthesizePolly(ssml, voice, this.polly)
          .then(res => audio.toAlexaFormat(res.AudioStream, { asBuffer: true }))
          .then(buffer => awsHelpers.uploadMp3ToS3(key, this.config.renderer.bucket, buffer, this.s3))
          .then(_.constant(`<audio src="${url}" />`));
      });
  }
};
