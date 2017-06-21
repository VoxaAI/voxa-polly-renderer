'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

module.exports = {
  s3KeyExists,
  uploadMp3ToS3,
  synthesizePolly,
};

function s3KeyExists(key, bucket, s3) {
  return s3.headObject({
    Bucket: bucket,
    Key: key,
  }).promise()
    .then(_.constant(true))
    .catch((err) => {
      if (err.code !== 'NotFound') return Promise.reject(err);
      return false;
    });
}

function uploadMp3ToS3(key, s3Bucket, audio, s3) {
  return s3.putObject({
    ACL: 'public-read',
    Bucket: s3Bucket,
    Key: key,
    Body: audio,
    ContentType: 'audio/mpeg',
  }).promise();
}

function synthesizePolly(ssml, voice, polly) {
  return polly.synthesizeSpeech({
    OutputFormat: 'mp3',
    SampleRate: '16000',
    TextType: 'ssml',
    VoiceId: voice,
    Text: ssml,
  }).promise();
}
