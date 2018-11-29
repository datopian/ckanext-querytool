// It requires "Detailed Mortality by Cause" application (see staging)

const TIMEOUT = 10000
const ELEMENTS = {
  filters: '#main-causes-of-death .filters',
  arrow: '#main-causes-of-death .filters .fa-arrow-right',
}

module.exports = {
  afterEach: (client, done) => client.globals.report(client, done),

  '[default] There should not be arrow on the left':
    (client) => {
      client
        .url(`${client.launch_url}/querytool/public/detailed-mortality-by-cause`)
        .waitForElementVisible(ELEMENTS.filters, TIMEOUT)
        .assert.elementNotPresent(ELEMENTS.arrow)
        .end();
    },

};
