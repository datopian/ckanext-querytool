// It requires "Detailed Mortality by Cause" application (see staging)

const TIMEOUT = 10000
const ELEMENTS = {
  staticReferenceLabel: '.chart:nth-child(1) .c3-grid text',
}

module.exports = {
  afterEach: (client, done) => client.globals.report(client, done),

  '[default] Test jumping to the related app':
    (client) => {
      client
        .url(`${client.launch_url}/querytool/public/detailed-mortality-by-cause`)
        .waitForElementVisible(ELEMENTS.staticReferenceLabel, TIMEOUT)
        .assert.containsText(ELEMENTS.staticReferenceLabel, 'Test Reference')
        .end();
    },

};
