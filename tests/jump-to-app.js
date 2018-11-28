// It requires "Detailed Mortality by Cause" application (see staging)

const TIMEOUT = 10000
const ELEMENTS = {
  selectMeasure: '#main-causes-of-death_y_axis_column',
  buttonUpdate: '.btn-update[data-anchor="main-causes-of-death"]',
}

module.exports = {
  afterEach: (client, done) => client.globals.report(client, done),

  '[default] Test jumping to the related app':
    (client) => {
      client
        .url(`${client.launch_url}/querytool/public/detailed-mortality-by-cause`)
        // Change measure and click update button
        .waitForElementVisible(ELEMENTS.selectMeasure, TIMEOUT)
        .setValue(ELEMENTS.selectMeasure, 'Percentagem')
        .click(ELEMENTS.buttonUpdate)
        .pause(TIMEOUT/10)
        .assert.urlContains('#main-causes-of-death')
        .end();
    },

};
