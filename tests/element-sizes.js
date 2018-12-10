// It requires "Detailed Mortality by Cause" application (see staging)

const TIMEOUT = 10000
const ELEMENTS = {
  selectSizes: '#chart_field_size_1',
}

module.exports = {
  afterEach: (client, done) => client.globals.report(client, done),

  '[main] Check select box with sizes':
    (client) => {
      client
        // Login and open config
        .url(`${client.launch_url}/user/login`)
        .waitForElementVisible('body', TIMEOUT)
        .setValue('input#field-login', 'ckan_admin')
        .setValue('input#field-password', 'test1234')
        .click('button.btn-primary[type=submit]')
        .pause(TIMEOUT/10)
        // Check sizes
        .url(`${client.launch_url}/querytool/edit_visualizations/detailed-mortality-by-cause`)
        .waitForElementVisible(ELEMENTS.selectSizes, 10000)
        .assert.containsText(ELEMENTS.selectSizes, 'Small Rectangle (1x2)')
        .assert.containsText(ELEMENTS.selectSizes, 'Small Wide Rectangle (1x6)')
        .assert.containsText(ELEMENTS.selectSizes, 'Medium Square (2x2)')
        .assert.containsText(ELEMENTS.selectSizes, 'Medium Rectangle (2x3)')
        .assert.containsText(ELEMENTS.selectSizes, 'Large Rectangle (2x4)')
        .assert.containsText(ELEMENTS.selectSizes, 'Extra Large Rectangle (2x6)')
        .assert.containsText(ELEMENTS.selectSizes, 'Large Square (4x4)')
        .assert.containsText(ELEMENTS.selectSizes, 'Medium Vertical (4x2)')
        .end();
    },

};
