Voxa Polly Renderer
====================

[![Travis](https://img.shields.io/travis/mediarain/voxa-polly-renderer.svg)](https://travis-ci.org/mediarain/voxa-polly-renderer)
[![Coveralls](https://img.shields.io/coveralls/mediarain/voxa-polly-renderer.svg)](https://coveralls.io/github/mediarain/voxa-polly-renderer)

A custom renderer for Voxa that uses AWS Polly text to speech, this allows you to have skills with voices other than the alexa ones


Installation
-------------

Install from [npm](https://www.npmjs.com/package/voxa-polly-renderer)

```bash
npm install --save voxa-polly-renderer
```


Usage
------

```javascript
const Voxa = require('voxa');
const PollyRenderer = require('voxa-polly-renderer').PollyRenderer;


// initialize the skill
const skill = new Voxa({
  variables,
  views,
  RenderClass: PollyRenderer,
  renderer: {
    bucket: 'YOU_S3_BUCKET',
    s3Path: 'THE_PATH_IN_YOUR_S3_BUCKET_TO_STORE_AUDIO',
  },
});

// Update your view to specify the voice you want to use
// Eg:
const views = {
      LaunchView: {
        say: 'Welcome back to Voxa, this view will be read using the Joey voice from Polly ',
        voice: 'Joey',
      },
};
```
