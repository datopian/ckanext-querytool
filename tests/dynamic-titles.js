// It requires "Detailed Mortality by Cause" application (see staging)

const TIMEOUT = 10000
const ELEMENTS = {
  titleTextarea: '#chart_field_title_1',
  titleOnFormChart: '#chart_field_1 .c3-title',
  titleOnAppChart: '.chart:nth-child(1) .c3-title',
  selectMeasure: '#detailed-mortality-by-cause_y_axis_column',
  buttonUpdate: '.btn-update[data-anchor="main-causes-of-death"]',
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
        // Check input value
        .url(`${client.launch_url}/querytool/edit_visualizations/detailed-mortality-by-cause`)
        .waitForElementVisible(ELEMENTS.titleTextarea, TIMEOUT)
        .assert.containsText(ELEMENTS.titleTextarea, '{measure|capitalize} por {cause_group|lower}')
        // Check form chart value
        .waitForElementVisible(ELEMENTS.titleOnFormChart, TIMEOUT)
        .assert.containsText(ELEMENTS.titleOnFormChart, 'Taxa de mortalidade por causas externas')
        // Check app chart value
        .url(`${client.launch_url}/querytool/public/detailed-mortality-by-cause`)
        .waitForElementVisible(ELEMENTS.titleOnAppChart, TIMEOUT)
        .assert.containsText(ELEMENTS.titleOnAppChart, 'Taxa de mortalidade por causas externas')
        .setValue(ELEMENTS.selectMeasure, 'Percentagem')
        .click(ELEMENTS.buttonUpdate)
        .waitForElementVisible(ELEMENTS.titleOnAppChart, TIMEOUT)
        .assert.containsText(ELEMENTS.titleOnAppChart, 'Percentagem (alias) por causas externas')
        .end();
    },

};
