// It requires "Detailed Mortality by Cause" application (see staging)

const TIMEOUT = 10000
const ELEMENTS = {
  dynamicReferenceLabel: '.chart:nth-child(1) .c3-ygrid-line:nth-child(2) text',
}

module.exports = {
  afterEach: (client, done) => client.globals.report(client, done),

  '[default] Dynamic reference line':
    (client) => {
      client
        .url(`${client.launch_url}/querytool/public/detailed-mortality-by-cause`)
        .waitForElementVisible(ELEMENTS.dynamicReferenceLabel, TIMEOUT)
        .assert.containsText(ELEMENTS.dynamicReferenceLabel, 'Dynamic Reference')
        .end();
    },

};
