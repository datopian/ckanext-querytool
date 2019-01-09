// It requires "Detailed Mortality by Cause" application (see staging)

const TIMEOUT = 10000
const ELEMENTS = {
  defaultTableRow: '.table:nth-child(3) tbody tr:first-child',
  integerTableRow: '.table:nth-child(10) tbody tr:first-child',
}

module.exports = {
  afterEach: (client, done) => client.globals.report(client, done),

  '[default] Test jumping to the related app':
    (client) => {
      client
        .url(`${client.launch_url}/querytool/public/detailed-mortality-by-cause`)
        .waitForElementVisible(ELEMENTS.defaultTableRow, TIMEOUT)
        .assert.containsText(ELEMENTS.defaultTableRow, 'Ambos 168746.79')
        .waitForElementVisible(ELEMENTS.integerTableRow, TIMEOUT)
        .assert.containsText(ELEMENTS.integerTableRow, 'Acre 5362 256 862')
        .end();
    },

};
