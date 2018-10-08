import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'indicator',
  outputTargets:[
    {
      type: 'dist'
    },
    {
      type: 'www',
      serviceWorker: null
    }
  ]
};
